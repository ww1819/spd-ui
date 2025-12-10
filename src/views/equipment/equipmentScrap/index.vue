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
          <el-form-item label="报废单号" prop="scrapNo">
            <el-input
              v-model="queryParams.scrapNo"
              placeholder="请输入报废单号"
              clearable
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="报废状态" prop="scrapStatus">
            <el-select v-model="queryParams.scrapStatus" placeholder="请选择报废状态" clearable>
              <el-option
                v-for="dict in dict.type.scrap_status"
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
          v-hasPermi="['equipment:scrap:add']"
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
          v-hasPermi="['equipment:scrap:edit']"
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
          v-hasPermi="['equipment:scrap:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="small"
          @click="handleExport"
          v-hasPermi="['equipment:scrap:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="scrapList" @selection-change="handleSelectionChange" height="calc(100vh - 330px)">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="编号" align="center" prop="scrapId" width="50"/>
      <el-table-column label="报废单号" align="center" prop="scrapNo" width="120"/>
      <el-table-column label="设备名称" align="center" prop="equipmentName" width="180"/>
      <el-table-column label="报废人" align="center" prop="scrapUser" width="100"/>
      <el-table-column label="报废部门" align="center" prop="scrapDept" width="120"/>
      <el-table-column label="报废状态" align="center" prop="scrapStatus" width="80">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.scrap_status" :value="scope.row.scrapStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="报废时间" align="center" prop="scrapTime" width="100">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.scrapTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="120">
        <template slot-scope="scope">
          <el-button
            size="small"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['equipment:scrap:edit']"
          >修改</el-button>
          <el-button
            size="small"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['equipment:scrap:remove']"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加或修改设备报废对话框 -->
    <div v-if="open" class="local-modal-mask">
      <div class="local-modal-content">
        <div style="font-size:18px;font-weight:bold;margin-bottom:16px;">{{ title }}</div>
        <el-form ref="form" :model="form" :rules="rules" label-width="100px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="报废单号" prop="scrapNo">
                <el-input v-model="form.scrapNo" placeholder="请输入报废单号" />
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
              <el-form-item label="报废人" prop="scrapUser">
                <el-input v-model="form.scrapUser" placeholder="请输入报废人" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="报废状态" prop="scrapStatus">
                <el-select v-model="form.scrapStatus" placeholder="请选择报废状态">
                  <el-option
                    v-for="dict in dict.type.scrap_status"
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
              <el-form-item label="报废时间" prop="scrapTime">
                <el-date-picker
                  v-model="form.scrapTime"
                  type="datetime"
                  placeholder="选择报废时间"
                  value-format="yyyy-MM-dd HH:mm:ss"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="报废部门" prop="scrapDept">
                <el-input v-model="form.scrapDept" placeholder="请输入报废部门" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="报废原因" prop="scrapReason">
                <el-input v-model="form.scrapReason" placeholder="请输入报废原因" />
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
import { listEquipmentScrap, getEquipmentScrap, delEquipmentScrap, addEquipmentScrap, updateEquipmentScrap, exportEquipmentScrap, listEquipmentInfo } from "@/api/equipment/equipmentScrap";

export default {
  name: "EquipmentScrap",
  dicts: ['scrap_type', 'scrap_status'],
  data() {
    return {
      // 遮罩层
      loading: false,
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
      // 设备报废表格数据
      scrapList: [
        {
          scrapId: 1,
          scrapNo: "SP20240001",
          equipmentId: 1,
          equipmentName: "数控车床",
          scrapType: "0",
          scrapStatus: "0",
          scrapNum: 1,
          scrapDate: "2024-01-20",
          scrapUser: "张三",
          scrapDept: "生产部",
          scrapDesc: "设备老化严重，维修成本过高",
          scrapRemark: "已使用8年，主要部件磨损严重",
          createTime: "2024-01-20 10:00:00"
        },
        {
          scrapId: 2,
          scrapNo: "SP20240002",
          equipmentId: 2,
          equipmentName: "激光切割机",
          scrapType: "1",
          scrapStatus: "1",
          scrapNum: 1,
          scrapDate: "2024-01-21",
          scrapUser: "李四",
          scrapDept: "技术部",
          scrapDesc: "激光器损坏，更换成本过高",
          scrapRemark: "已使用6年，激光器功率严重衰减",
          createTime: "2024-01-21 14:30:00"
        },
        {
          scrapId: 3,
          scrapNo: "SP20240003",
          equipmentId: 3,
          equipmentName: "立式加工中心",
          scrapType: "0",
          scrapStatus: "2",
          scrapNum: 1,
          scrapDate: "2024-01-25",
          scrapUser: "王五",
          scrapDept: "制造部",
          scrapDesc: "设备故障频发，影响生产进度",
          scrapRemark: "已使用10年，控制系统老化",
          createTime: "2024-01-25 09:15:00"
        },
        {
          scrapId: 4,
          scrapNo: "SP20240004",
          equipmentId: 4,
          equipmentName: "折弯机",
          scrapType: "1",
          scrapStatus: "0",
          scrapNum: 1,
          scrapDate: "2024-01-30",
          scrapUser: "赵六",
          scrapDept: "钣金部",
          scrapDesc: "液压系统故障，维修价值不大",
          scrapRemark: "已使用7年，液压缸漏油严重",
          createTime: "2024-01-30 16:45:00"
        },
        {
          scrapId: 5,
          scrapNo: "SP20240005",
          equipmentId: 5,
          equipmentName: "冲床",
          scrapType: "0",
          scrapStatus: "1",
          scrapNum: 1,
          scrapDate: "2024-02-05",
          scrapUser: "钱七",
          scrapDept: "冲压部",
          scrapDesc: "安全装置失效，存在安全隐患",
          scrapRemark: "已使用9年，离合器磨损严重",
          createTime: "2024-02-05 11:20:00"
        }
      ],
      // 设备选项
      equipmentOptions: [
        {
          equipmentId: 1,
          equipmentName: "数控车床"
        },
        {
          equipmentId: 2,
          equipmentName: "激光切割机"
        },
        {
          equipmentId: 3,
          equipmentName: "立式加工中心"
        },
        {
          equipmentId: 4,
          equipmentName: "折弯机"
        },
        {
          equipmentId: 5,
          equipmentName: "冲床"
        }
      ],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 是否禁用
      isDisabled: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        scrapNo: null,
        equipmentName: null,
        scrapStatus: null
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        scrapNo: [
          { required: true, message: "报废编号不能为空", trigger: "blur" }
        ],
        equipmentName: [
          { required: true, message: "设备名称不能为空", trigger: "change" }
        ],
        scrapStatus: [
          { required: true, message: "报废状态不能为空", trigger: "change" }
        ]
      }
    };
  },
  created() {
    // 模拟数据，暂时注释掉API调用
    // this.getList();
    // this.getEquipmentOptions();
    this.total = this.scrapList.length;
  },
  methods: {
    /** 查询设备报废列表 */
    getList() {
      this.loading = true;
      // 模拟API调用
      setTimeout(() => {
        this.loading = false;
      }, 500);
    },
    /** 查询设备选项 */
    getEquipmentOptions() {
      // 模拟API调用
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        scrapId: null,
        scrapNo: null,
        equipmentId: null,
        scrapType: null,
        scrapStatus: null,
        scrapNum: 1,
        scrapDate: null,
        scrapUser: null,
        scrapDept: null,
        scrapDesc: null,
        scrapRemark: null
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
      this.ids = selection.map(item => item.scrapId)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加设备报废";
      this.isDisabled = false;
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const scrapId = row.scrapId || this.ids
      // 模拟API调用
      const data = this.equipmentScrapList.find(item => item.scrapId === scrapId);
      if (data) {
        this.form = { ...data };
        this.open = true;
        this.title = "修改设备报废";
        this.isDisabled = true;
      }
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          // 模拟API调用
          this.$modal.msgSuccess(this.form.scrapId ? "修改成功" : "新增成功");
          this.open = false;
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const scrapIds = row.scrapId || this.ids;
      this.$modal.confirm('是否确认删除设备报废编号为"' + scrapIds + '"的数据项？').then(() => {
        // 模拟API调用
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 导出按钮操作 */
    handleExport() {
      this.$modal.msgSuccess("导出成功");
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