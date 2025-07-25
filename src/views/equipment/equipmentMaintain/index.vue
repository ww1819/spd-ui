<template>
  <div>
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="100px">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="保养编号" prop="maintainCode">
            <el-input
              v-model="queryParams.maintainCode"
              placeholder="请输入保养编号"
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
          <el-form-item label="保养状态" prop="maintainStatus">
            <el-select v-model="queryParams.maintainStatus" placeholder="请选择保养状态" clearable style="width: 100%">
              <el-option
                v-for="dict in dict.type.maintain_status"
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
          v-hasPermi="['equipment:equipmentMaintain:add']"
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
          v-hasPermi="['equipment:equipmentMaintain:edit']"
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
          v-hasPermi="['equipment:equipmentMaintain:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['equipment:equipmentMaintain:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="equipmentMaintainList" @selection-change="handleSelectionChange" height="calc(100vh - 330px)">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="编号" align="center" prop="maintainId" width="50"/>
      <el-table-column label="保养编号" align="center" prop="maintainCode" width="120"/>
      <el-table-column label="设备名称" align="center" prop="equipmentName" width="120"/>
      <el-table-column label="保养类型" align="center" prop="maintainType" width="100">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.maintain_type" :value="scope.row.maintainType"/>
        </template>
      </el-table-column>
      <el-table-column label="保养状态" align="center" prop="maintainStatus" width="100">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.maintain_status" :value="scope.row.maintainStatus"/>
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
            v-hasPermi="['equipment:equipmentMaintain:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['equipment:equipmentMaintain:remove']"
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

    <!-- 添加或修改设备保养对话框 -->
    <div v-if="open" class="local-modal-mask">
      <div class="local-modal-content">
        <div style="font-size:18px;font-weight:bold;margin-bottom:16px;">{{ title }}</div>
        <el-form ref="form" :model="form" :rules="rules" label-width="100px">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-form-item label="保养编号" prop="maintainCode">
                <el-input v-model="form.maintainCode" :disabled="isDisabled" placeholder="请输入保养编号" />
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
              <el-form-item label="保养类型" prop="maintainType">
                <el-select v-model="form.maintainType" placeholder="请选择保养类型" style="width: 100%">
                  <el-option
                    v-for="dict in dict.type.maintain_type"
                    :key="dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="保养状态" prop="maintainStatus">
                <el-select v-model="form.maintainStatus" placeholder="请选择保养状态" style="width: 100%">
                  <el-option
                    v-for="dict in dict.type.maintain_status"
                    :key="dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="保养人员" prop="maintainUser">
                <el-input v-model="form.maintainUser" placeholder="请输入保养人员" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="保养部门" prop="maintainDept">
                <el-input v-model="form.maintainDept" placeholder="请输入保养部门" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="保养费用" prop="maintainCost">
                <el-input-number v-model="form.maintainCost" :precision="2" :step="0.1" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="保养日期" prop="maintainDate">
                <el-date-picker
                  v-model="form.maintainDate"
                  type="date"
                  placeholder="选择保养日期"
                  style="width: 100%"
                  value-format="yyyy-MM-dd"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="保养内容" prop="maintainContent">
                <el-input v-model="form.maintainContent" type="textarea" placeholder="请输入保养内容" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="保养结果" prop="maintainResult">
                <el-input v-model="form.maintainResult" type="textarea" placeholder="请输入保养结果" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="保养备注" prop="maintainRemark">
                <el-input v-model="form.maintainRemark" type="textarea" placeholder="请输入保养备注" />
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
import { listEquipmentMaintain, getEquipmentMaintain, delEquipmentMaintain, addEquipmentMaintain, updateEquipmentMaintain, exportEquipmentMaintain } from "@/api/equipment/equipmentMaintain";

export default {
  name: "EquipmentMaintain",
  dicts: ['maintain_status', 'maintain_type'],
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
      // 设备保养表格数据
      equipmentMaintainList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        maintainCode: null,
        equipmentName: null,
        maintainStatus: null,
        beginDate: null,
        endDate: null
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        maintainCode: [
          { required: true, message: "保养编号不能为空", trigger: "blur" }
        ],
        equipmentName: [
          { required: true, message: "设备名称不能为空", trigger: "blur" }
        ],
        maintainType: [
          { required: true, message: "保养类型不能为空", trigger: "change" }
        ],
        maintainStatus: [
          { required: true, message: "保养状态不能为空", trigger: "change" }
        ]
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询设备保养列表 */
    getList() {
      this.loading = true;
      // 模拟数据
      setTimeout(() => {
        this.equipmentMaintainList = [
          {
            maintainId: 1,
            maintainCode: 'BY001',
            equipmentName: '数控车床',
            maintainType: '0',
            maintainStatus: '0',
            maintainTime: '2024-01-15 08:00:00',
            maintainer: '张师傅',
            cost: 500,
            maintainContent: '更换润滑油、清洁导轨、检查主轴',
            remark: '定期保养，设备运行正常'
          },
          {
            maintainId: 2,
            maintainCode: 'BY002',
            equipmentName: '激光切割机',
            maintainType: '1',
            maintainStatus: '1',
            maintainTime: '2024-01-20 09:00:00',
            maintainer: '李师傅',
            cost: 800,
            maintainContent: '清洁光学镜片、检查激光器、校准光路',
            remark: '预防性保养，确保切割精度'
          },
          {
            maintainId: 3,
            maintainCode: 'BY003',
            equipmentName: '立式加工中心',
            maintainType: '0',
            maintainStatus: '2',
            maintainTime: '2024-01-25 14:00:00',
            maintainer: '王师傅',
            cost: 1200,
            maintainContent: '更换切削液、清洁工作台、检查刀库',
            remark: '全面保养，提高设备效率'
          },
          {
            maintainId: 4,
            maintainCode: 'BY004',
            equipmentName: '折弯机',
            maintainType: '1',
            maintainStatus: '0',
            maintainTime: '2024-01-30 10:00:00',
            maintainer: '赵师傅',
            cost: 600,
            maintainContent: '检查液压系统、清洁模具、润滑导轨',
            remark: '定期保养，延长设备寿命'
          },
          {
            maintainId: 5,
            maintainCode: 'BY005',
            equipmentName: '冲床',
            maintainType: '0',
            maintainStatus: '1',
            maintainTime: '2024-02-05 11:00:00',
            maintainer: '钱师傅',
            cost: 400,
            maintainContent: '检查离合器、清洁模具、润滑传动部件',
            remark: '预防性保养，确保安全运行'
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
        maintainId: null,
        maintainCode: null,
        equipmentName: null,
        maintainType: null,
        maintainStatus: "0",
        maintainTime: null,
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
      this.ids = selection.map(item => item.maintainId)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加设备保养";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const maintainId = row.maintainId || this.ids
      getEquipmentMaintain(maintainId).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改设备保养";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.maintainId != null) {
            updateEquipmentMaintain(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addEquipmentMaintain(this.form).then(response => {
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
      const maintainIds = row.maintainId || this.ids;
      this.$modal.confirm('是否确认删除设备保养编号为"' + maintainIds + '"的数据项？').then(function() {
        return delEquipmentMaintain(maintainIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('equipment/maintain/export', {
        ...this.queryParams
      }, `equipment_maintain_${new Date().getTime()}.xlsx`)
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