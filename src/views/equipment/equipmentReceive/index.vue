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
          <el-form-item label="领用单号" prop="receiveNo">
            <el-input
              v-model="queryParams.receiveNo"
              placeholder="请输入领用单号"
              clearable
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="领用状态" prop="receiveStatus">
            <el-select v-model="queryParams.receiveStatus" placeholder="请选择领用状态" clearable>
              <el-option
                v-for="dict in dict.type.receive_status"
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
          v-hasPermi="['equipment:receive:add']"
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
          v-hasPermi="['equipment:receive:edit']"
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
          v-hasPermi="['equipment:receive:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['equipment:receive:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="equipmentReceiveList" @selection-change="handleSelectionChange" height="calc(100vh - 330px)">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="编号" align="center" prop="receiveId" width="50"/>
      <el-table-column label="领用单号" align="center" prop="receiveNo" width="120"/>
      <el-table-column label="设备名称" align="center" prop="equipmentName" width="180"/>
      <el-table-column label="领用数量" align="center" prop="receiveNum" width="80"/>
      <el-table-column label="领用人" align="center" prop="receiveUser" width="100"/>
      <el-table-column label="领用部门" align="center" prop="receiveDept" width="120"/>
      <el-table-column label="领用状态" align="center" prop="receiveStatus" width="80">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.receive_status" :value="scope.row.receiveStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="领用时间" align="center" prop="receiveTime" width="100">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.receiveTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="120">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['equipment:receive:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['equipment:receive:remove']"
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

    <!-- 添加或修改设备接收对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="600px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="接收编号" prop="receiveCode">
              <el-input v-model="form.receiveCode" placeholder="请输入接收编号" />
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
            <el-form-item label="领用数量" prop="receiveNum">
              <el-input-number v-model="form.receiveNum" :min="1" controls-position="right" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="领用状态" prop="receiveStatus">
              <el-select v-model="form.receiveStatus" placeholder="请选择领用状态">
                <el-option
                  v-for="dict in dict.type.receive_status"
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
            <el-form-item label="领用时间" prop="receiveTime">
              <el-date-picker
                v-model="form.receiveTime"
                type="datetime"
                placeholder="选择领用时间"
                value-format="yyyy-MM-dd HH:mm:ss"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="领用人" prop="receiveUser">
              <el-input v-model="form.receiveUser" placeholder="请输入领用人" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="领用部门" prop="receiveDept">
              <el-input v-model="form.receiveDept" placeholder="请输入领用部门" />
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
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listEquipmentReceive, getEquipmentReceive, delEquipmentReceive, addEquipmentReceive, updateEquipmentReceive, exportEquipmentReceive } from "@/api/equipment/equipmentReceive";

export default {
  name: "EquipmentReceive",
  dicts: ['receive_status'],
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
      // 设备接收表格数据
      equipmentReceiveList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        receiveCode: null,
        equipmentName: null,
        receiveStatus: null,
        beginDate: null,
        endDate: null
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        receiveCode: [
          { required: true, message: "接收编号不能为空", trigger: "blur" }
        ],
        equipmentName: [
          { required: true, message: "设备名称不能为空", trigger: "blur" }
        ],
        receiveNum: [
          { required: true, message: "领用数量不能为空", trigger: "blur" }
        ],
        receiveStatus: [
          { required: true, message: "领用状态不能为空", trigger: "change" }
        ]
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询设备接收列表 */
    getList() {
      this.loading = true;
      // 模拟数据
      setTimeout(() => {
        this.equipmentReceiveList = [
          {
            receiveId: 1,
            receiveCode: 'LY001',
            equipmentName: '数控车床',
            receiveNum: 1,
            receiveStatus: '0',
            receiveTime: '2024-01-15 09:00:00',
            receiveUser: '张三',
            receiveDept: '生产部',
            contactPhone: '13800138001',
            receiveReason: '新项目需要，用于精密零件加工',
            remark: '设备已接收，正在调试'
          },
          {
            receiveId: 2,
            receiveCode: 'LY002',
            equipmentName: '激光切割机',
            receiveNum: 1,
            receiveStatus: '1',
            receiveTime: '2024-01-20 14:00:00',
            receiveUser: '李四',
            receiveDept: '技术部',
            contactPhone: '13800138002',
            receiveReason: '技术研发项目使用',
            remark: '设备接收中，等待验收'
          },
          {
            receiveId: 3,
            receiveCode: 'LY003',
            equipmentName: '立式加工中心',
            receiveNum: 1,
            receiveStatus: '2',
            receiveTime: '2024-01-25 10:00:00',
            receiveUser: '王五',
            receiveDept: '制造部',
            contactPhone: '13800138003',
            receiveReason: '批量生产订单需要',
            remark: '设备已接收，验收完成'
          },
          {
            receiveId: 4,
            receiveCode: 'LY004',
            equipmentName: '折弯机',
            receiveNum: 1,
            receiveStatus: '0',
            receiveTime: '2024-01-30 11:00:00',
            receiveUser: '赵六',
            receiveDept: '钣金部',
            contactPhone: '13800138004',
            receiveReason: '钣金加工项目需要',
            remark: '设备接收申请已提交'
          },
          {
            receiveId: 5,
            receiveCode: 'LY005',
            equipmentName: '冲床',
            receiveNum: 1,
            receiveStatus: '1',
            receiveTime: '2024-02-05 13:00:00',
            receiveUser: '钱七',
            receiveDept: '冲压部',
            contactPhone: '13800138005',
            receiveReason: '冲压件生产需要',
            remark: '设备接收中，质量检验中'
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
        receiveId: null,
        receiveCode: null,
        equipmentName: null,
        receiveNum: 1,
        receiveStatus: "0",
        receiveTime: null,
        receiveUser: null,
        receiveDept: null,
        contactPhone: null,
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
      this.ids = selection.map(item => item.receiveId)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加设备接收";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const receiveId = row.receiveId || this.ids
      getEquipmentReceive(receiveId).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改设备接收";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.receiveId != null) {
            updateEquipmentReceive(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addEquipmentReceive(this.form).then(response => {
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
      const receiveIds = row.receiveId || this.ids;
      this.$modal.confirm('是否确认删除设备接收编号为"' + receiveIds + '"的数据项？').then(function() {
        return delEquipmentReceive(receiveIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('equipment/receive/export', {
        ...this.queryParams
      }, `equipment_receive_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>

 