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
          <el-form-item label="入库单号" prop="storageNo">
            <el-input
              v-model="queryParams.storageNo"
              placeholder="请输入入库单号"
              clearable
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="入库状态" prop="storageStatus">
            <el-select v-model="queryParams.storageStatus" placeholder="请选择入库状态" clearable>
              <el-option
                v-for="dict in dict.type.storage_status"
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
          v-hasPermi="['equipment:storage:add']"
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
          v-hasPermi="['equipment:storage:edit']"
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
          v-hasPermi="['equipment:storage:remove']"
        >删除</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="storageList" @selection-change="handleSelectionChange" height="calc(100vh - 330px)">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="编号" align="center" prop="storageId" width="50"/>
      <el-table-column label="入库单号" align="center" prop="storageNo" width="120"/>
      <el-table-column label="设备名称" align="center" prop="equipmentName" width="120"/>
      <el-table-column label="入库数量" align="center" prop="storageNum" width="80"/>
      <el-table-column label="入库单价" align="center" prop="storagePrice" width="100"/>
      <el-table-column label="入库总价" align="center" prop="storageAmount" width="100"/>
      <el-table-column label="入库状态" align="center" prop="storageStatus" width="100">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.storage_status" :value="scope.row.storageStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="入库时间" align="center" prop="storageTime" width="100">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.storageTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="120">
        <template slot-scope="scope">
          <el-button
            size="small"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['equipment:storage:edit']"
          >修改</el-button>
          <el-button
            size="small"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['equipment:storage:remove']"
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

    <!-- 添加或修改设备入库对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="600px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="入库单号" prop="storageNo">
              <el-input v-model="form.storageNo" placeholder="请输入入库单号" />
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
            <el-form-item label="入库数量" prop="storageNum">
              <el-input-number v-model="form.storageNum" :min="1" controls-position="right" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="入库单价" prop="storagePrice">
              <el-input-number v-model="form.storagePrice" :precision="2" :step="0.1" controls-position="right" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="入库总价" prop="storageAmount">
              <el-input-number v-model="form.storageAmount" :precision="2" :step="0.1" controls-position="right" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="入库状态" prop="storageStatus">
              <el-select v-model="form.storageStatus" placeholder="请选择入库状态">
                <el-option
                  v-for="dict in dict.type.storage_status"
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
            <el-form-item label="入库时间" prop="storageTime">
              <el-date-picker
                v-model="form.storageTime"
                type="datetime"
                placeholder="选择入库时间"
                value-format="yyyy-MM-dd HH:mm:ss"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="供应商" prop="supplier">
              <el-input v-model="form.supplier" placeholder="请输入供应商" />
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
import { listEquipmentStorage, getEquipmentStorage, delEquipmentStorage, addEquipmentStorage, updateEquipmentStorage } from "@/api/equipment/equipmentStorage";

export default {
  name: "EquipmentStorage",
  dicts: ['storage_status'],
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
      // 设备入库表格数据
      storageList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        equipmentName: null,
        storageNo: null,
        storageStatus: null,
        beginDate: null,
        endDate: null
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        storageNo: [
          { required: true, message: "入库单号不能为空", trigger: "blur" }
        ],
        equipmentName: [
          { required: true, message: "设备名称不能为空", trigger: "blur" }
        ],
        storageNum: [
          { required: true, message: "入库数量不能为空", trigger: "blur" }
        ],
        storagePrice: [
          { required: true, message: "入库单价不能为空", trigger: "blur" }
        ],
        storageStatus: [
          { required: true, message: "入库状态不能为空", trigger: "change" }
        ]
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询设备入库列表 */
    getList() {
      this.loading = true;
      // 模拟数据
      setTimeout(() => {
        this.storageList = [
          {
            storageId: 1,
            storageNo: 'RK001',
            equipmentName: '数控车床',
            storageNum: 1,
            storagePrice: 85000,
            storageAmount: 85000,
            storageStatus: '0',
            storageTime: '2024-01-15 10:00:00',
            supplier: '大连机床集团',
            storageLocation: '仓库A区-01',
            remark: '新设备入库，质量检验合格'
          },
          {
            storageId: 2,
            storageNo: 'RK002',
            equipmentName: '激光切割机',
            storageNum: 1,
            storagePrice: 120000,
            storageAmount: 120000,
            storageStatus: '1',
            storageTime: '2024-01-20 14:00:00',
            supplier: '大族激光',
            storageLocation: '仓库B区-02',
            remark: '设备入库中，等待验收'
          },
          {
            storageId: 3,
            storageNo: 'RK003',
            equipmentName: '立式加工中心',
            storageNum: 1,
            storagePrice: 180000,
            storageAmount: 180000,
            storageStatus: '2',
            storageTime: '2024-01-25 09:00:00',
            supplier: '沈阳机床集团',
            storageLocation: '仓库C区-03',
            remark: '设备已入库，验收完成'
          },
          {
            storageId: 4,
            storageNo: 'RK004',
            equipmentName: '折弯机',
            storageNum: 1,
            storagePrice: 65000,
            storageAmount: 65000,
            storageStatus: '0',
            storageTime: '2024-01-30 11:00:00',
            supplier: '亚威机床',
            storageLocation: '仓库D区-04',
            remark: '设备入库，等待调试'
          },
          {
            storageId: 5,
            storageNo: 'RK005',
            equipmentName: '冲床',
            storageNum: 1,
            storagePrice: 45000,
            storageAmount: 45000,
            storageStatus: '1',
            storageTime: '2024-02-05 13:00:00',
            supplier: '扬力集团',
            storageLocation: '仓库E区-05',
            remark: '设备入库中，质量检验中'
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
        storageId: null,
        storageNo: null,
        equipmentName: null,
        storageNum: 1,
        storagePrice: 0,
        storageAmount: 0,
        storageStatus: "0",
        storageTime: null,
        supplier: null,
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
      this.ids = selection.map(item => item.storageId)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加设备入库";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const storageId = row.storageId || this.ids
      getEquipmentStorage(storageId).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改设备入库";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.storageId != null) {
            updateEquipmentStorage(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addEquipmentStorage(this.form).then(response => {
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
      const storageIds = row.storageId || this.ids;
      this.$modal.confirm('是否确认删除设备入库编号为"' + storageIds + '"的数据项？').then(function() {
        return delEquipmentStorage(storageIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    }
  }
};
</script>

 