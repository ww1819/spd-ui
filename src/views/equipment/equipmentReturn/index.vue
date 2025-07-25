<template>
  <div>
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="100px">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="退库单号" prop="returnCode">
            <el-input
              v-model="queryParams.returnCode"
              placeholder="请输入退库单号"
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
          <el-form-item label="退库状态" prop="returnStatus">
            <el-select v-model="queryParams.returnStatus" placeholder="请选择退库状态" clearable style="width: 100%">
              <el-option
                v-for="dict in dict.type.return_status"
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
          v-hasPermi="['equipment:equipmentReturn:add']"
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
          v-hasPermi="['equipment:equipmentReturn:edit']"
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
          v-hasPermi="['equipment:equipmentReturn:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['equipment:equipmentReturn:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="equipmentReturnList" @selection-change="handleSelectionChange" height="calc(100vh - 330px)">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="编号" align="center" prop="returnId" width="50"/>
      <el-table-column label="退库单号" align="center" prop="returnCode" width="120"/>
      <el-table-column label="设备名称" align="center" prop="equipmentName" width="120"/>
      <el-table-column label="退库类型" align="center" prop="returnType" width="100">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.return_type" :value="scope.row.returnType"/>
        </template>
      </el-table-column>
      <el-table-column label="退库状态" align="center" prop="returnStatus" width="100">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.return_status" :value="scope.row.returnStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="退库时间" align="center" prop="returnTime" width="100">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.returnTime, '{y}-{m}-{d}') }}</span>
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
            v-hasPermi="['equipment:equipmentReturn:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['equipment:equipmentReturn:remove']"
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

    <!-- 添加或修改设备退库记录对话框 -->
    <div v-if="open" class="local-modal-mask">
      <div class="local-modal-content">
        <div style="font-size:18px;font-weight:bold;margin-bottom:16px;">{{ title }}</div>
        <el-form ref="form" :model="form" :rules="rules" label-width="100px">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-form-item label="退库单号" prop="returnCode">
                <el-input v-model="form.returnCode" :disabled="isDisabled" placeholder="请输入退库单号" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="设备名称" prop="equipmentName">
                <el-input v-model="form.equipmentName" placeholder="请输入设备名称" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="退库类型" prop="returnType">
                <el-select v-model="form.returnType" placeholder="请选择退库类型" style="width: 100%">
                  <el-option
                    v-for="dict in dict.type.return_type"
                    :key="dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="退库状态" prop="returnStatus">
                <el-select v-model="form.returnStatus" placeholder="请选择退库状态" style="width: 100%">
                  <el-option
                    v-for="dict in dict.type.return_status"
                    :key="dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="退库时间" prop="returnTime">
                <el-date-picker
                  v-model="form.returnTime"
                  type="datetime"
                  placeholder="选择退库时间"
                  style="width: 100%"
                  value-format="yyyy-MM-dd HH:mm:ss"
                />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="退库人员" prop="returnUser">
                <el-input v-model="form.returnUser" placeholder="请输入退库人员" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="退库部门" prop="returnDept">
                <el-input v-model="form.returnDept" placeholder="请输入退库部门" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="退库数量" prop="returnNum">
                <el-input-number v-model="form.returnNum" :min="1" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="退库说明" prop="returnDesc">
                <el-input v-model="form.returnDesc" type="textarea" placeholder="请输入退库说明" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="退库备注" prop="returnRemark">
                <el-input v-model="form.returnRemark" type="textarea" placeholder="请输入退库备注" />
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
import { listEquipmentReturn, getEquipmentReturn, delEquipmentReturn, addEquipmentReturn, updateEquipmentReturn, exportEquipmentReturn } from "@/api/equipment/equipmentReturn";

export default {
  name: "EquipmentReturn",
  dicts: ['return_status'],
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
      // 设备归还表格数据
      equipmentReturnList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        returnCode: null,
        equipmentName: null,
        returnStatus: null,
        beginDate: null,
        endDate: null
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        returnCode: [
          { required: true, message: "归还编号不能为空", trigger: "blur" }
        ],
        equipmentName: [
          { required: true, message: "设备名称不能为空", trigger: "blur" }
        ],
        returnStatus: [
          { required: true, message: "归还状态不能为空", trigger: "change" }
        ]
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询设备归还列表 */
    getList() {
      this.loading = true;
      // 模拟数据
      setTimeout(() => {
        this.equipmentReturnList = [
          {
            returnId: 1,
            returnCode: 'GH001',
            equipmentName: '数控车床',
            returnStatus: '0',
            returnTime: '2024-01-20 17:00:00',
            returnUser: '张三',
            returnDept: '生产部',
            borrowTime: '2024-01-15 09:00:00',
            returnReason: '生产任务完成，设备归还',
            remark: '设备状态良好，无损坏'
          },
          {
            returnId: 2,
            returnCode: 'GH002',
            equipmentName: '激光切割机',
            returnStatus: '1',
            returnTime: '2024-01-25 16:00:00',
            returnUser: '李四',
            returnDept: '技术部',
            borrowTime: '2024-01-18 14:00:00',
            returnReason: '研发项目结束，设备归还',
            remark: '设备正在检查中'
          },
          {
            returnId: 3,
            returnCode: 'GH003',
            equipmentName: '立式加工中心',
            returnStatus: '2',
            returnTime: '2024-01-12 18:00:00',
            returnUser: '王五',
            returnDept: '质检部',
            borrowTime: '2024-01-10 08:00:00',
            returnReason: '质量检测完成，设备归还',
            remark: '设备已归还，检测结果正常'
          },
          {
            returnId: 4,
            returnCode: 'GH004',
            equipmentName: '折弯机',
            returnStatus: '0',
            returnTime: '2024-01-25 16:00:00',
            returnUser: '赵六',
            returnDept: '制造部',
            borrowTime: '2024-01-22 10:00:00',
            returnReason: '批量生产完成，设备归还',
            remark: '设备运行正常，无异常'
          },
          {
            returnId: 5,
            returnCode: 'GH005',
            equipmentName: '冲床',
            returnStatus: '1',
            returnTime: '2024-02-10 15:00:00',
            returnUser: '钱七',
            returnDept: '维修部',
            borrowTime: '2024-01-25 13:00:00',
            returnReason: '设备维护完成，准备归还',
            remark: '设备维护完成，等待验收'
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
        returnId: null,
        returnCode: null,
        equipmentName: null,
        returnStatus: "0",
        returnTime: null,
        returnUser: null,
        returnDept: null,
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
      this.ids = selection.map(item => item.returnId)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加设备归还";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const returnId = row.returnId || this.ids
      getEquipmentReturn(returnId).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改设备归还";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.returnId != null) {
            updateEquipmentReturn(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addEquipmentReturn(this.form).then(response => {
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
      const returnIds = row.returnId || this.ids;
      this.$modal.confirm('是否确认删除设备归还编号为"' + returnIds + '"的数据项？').then(function() {
        return delEquipmentReturn(returnIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('equipment/return/export', {
        ...this.queryParams
      }, `equipment_return_${new Date().getTime()}.xlsx`)
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