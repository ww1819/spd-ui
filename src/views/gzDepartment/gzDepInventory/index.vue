<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="耗材" prop="materialId" label-width="100px">
            <SelectMaterial v-model="queryParams.materialId" />
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item label="科室" prop="departmentId" label-width="100px">
            <SelectDepartment v-model="queryParams.departmentId" />
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item label="数量" prop="qty" label-width="100px">
            <el-input
              v-model="queryParams.qty"
              placeholder="请输入数量"
              clearable
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item label="单价" prop="unitPrice" label-width="100px">
            <el-input
              v-model="queryParams.unitPrice"
              placeholder="请输入单价"
              clearable
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="金额" prop="amt" label-width="100px">
            <el-input
              v-model="queryParams.amt"
              placeholder="请输入金额"
              clearable
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item label="批次号" prop="batchNo" label-width="100px">
            <el-input
              v-model="queryParams.batchNo"
              placeholder="请输入批次号"
              clearable
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item label="批号" prop="materialNo" label-width="100px">
            <el-input
              v-model="queryParams.materialNo"
              placeholder="请输入批号"
              clearable
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item label="耗材日期" prop="materialDate" label-width="100px">
            <el-date-picker clearable
                            v-model="queryParams.materialDate"
                            type="date"
                            value-format="yyyy-MM-dd"
                            placeholder="请选择耗材日期">
            </el-date-picker>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="入库日期" prop="warehouseDate" label-width="100px">
            <el-date-picker clearable
                            v-model="queryParams.warehouseDate"
                            type="date"
                            value-format="yyyy-MM-dd"
                            placeholder="请选择入库日期">
            </el-date-picker>
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item >
            <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
            <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <el-table v-loading="loading" :data="gzDepInventoryList" @selection-change="handleSelectionChange">
      <el-table-column label="耗材ID" align="center" prop="material.code" width="120"/>
      <el-table-column label="耗材" align="center" prop="material.name" />
      <el-table-column label="科室" align="center" prop="department.name" width="120"/>
      <el-table-column label="数量" align="center" prop="qty" width="120"/>
      <el-table-column label="单价" align="center" prop="unitPrice" width="120">
        <template slot-scope="scope">
          <span v-if="scope.row.unitPrice">{{ scope.row.unitPrice | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="金额" align="center" prop="amt" width="120">
        <template slot-scope="scope">
          <span v-if="scope.row.amt">{{ scope.row.amt | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="批次号" align="center" prop="batchNo" width="200"/>
      <el-table-column label="批号" align="center" prop="materialNo" width="200"/>
      <el-table-column label="耗材日期" align="center" prop="materialDate" width="200">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.materialDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="入库日期" align="center" prop="warehouseDate" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.warehouseDate, '{y}-{m}-{d}') }}</span>
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
  </div>
</template>

<script>
import { listGzDepInventory, getGzDepInventory} from "@/api/gzDepartment/gzDepInventory";
import SelectMaterial from "@/components/SelectModel/SelectMaterial";
import SelectDepartment from "@/components/SelectModel/SelectDepartment";

export default {
  name: "GzDepInventory",
  components: {SelectMaterial,SelectDepartment},
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
      // 高值科室库存表格数据
      gzDepInventoryList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        materialId: null,
        departmentId: null,
        qty: null,
        unitPrice: null,
        amt: null,
        batchNo: null,
        materialNo: null,
        materialDate: null,
        warehouseDate: null
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询高值科室库存列表 */
    getList() {
      this.loading = true;
      listGzDepInventory(this.queryParams).then(response => {
        this.gzDepInventoryList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        id: null,
        materialId: null,
        departmentId: null,
        qty: null,
        unitPrice: null,
        amt: null,
        batchNo: null,
        materialNo: null,
        materialDate: null,
        warehouseDate: null
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
      this.ids = selection.map(item => item.id)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('gzDepartment/gzDepInventory/export', {
        ...this.queryParams
      }, `gzDepInventory_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>
