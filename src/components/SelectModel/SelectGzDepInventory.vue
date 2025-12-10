<template>
  <div class="app-container">
    <el-dialog title="高值科室库存明细" :visible.sync="show" append-to-body width="1600px" :before-close="handleClose">
      <el-form :model="queryParams" ref="queryForm" :inline="true" v-show="showSearch" label-width="68px">
        <el-row :gutter="20">

          <el-col :span="6">
            <el-form-item label="科室" prop="departmentId" label-width="100px">
              <SelectDepartment v-model="queryParams.departmentId" :value2="isShow"/>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="耗材" prop="materialId" label-width="100px">
              <SelectMaterial v-model="queryParams.materialId" />
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
            <el-form-item>
              <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery">搜索</el-button>
              <el-button icon="el-icon-refresh" size="small" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <el-table :data="inventoryList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
<!--        <el-table-column label="耗材ID" align="center" prop="material.id" width="120"/>-->
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
        <el-table-column label="耗材批次号" align="center" prop="materialNo" width="200"/>
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

      <span slot="footer" class="dialog-footer">
          <el-button @click="handleClose">取 消</el-button>
          <el-button type="primary" @click="checkBtn">确 定</el-button>
      </span>

      <pagination
        v-show="total>0"
        :total="total"
        :page.sync="queryParams.pageNum"
        :limit.sync="queryParams.pageSize"
        @pagination="getList"
      />
    </el-dialog>

  </div>
</template>

<script>
import { listGzDepInventory } from "@/api/gzDepartment/gzDepInventory.js";
import SelectMaterial from "@/components/SelectModel/SelectMaterial";
import SelectDepartment from "@/components/SelectModel/SelectDepartment";

export default {
  name: "SelectGzInventory",
  components: {SelectMaterial,SelectDepartment},
  props: ['DialogComponentShow','departmentValue'], //接受父组件传递过来的数据
  data() {
    return {
      // 遮罩层
      show: false, //弹窗默认隐藏
      selectRow: [], //选择的行数据
      isShow: true,//是否显示
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
      // 科室库存信息表格数据
      inventoryList: [],
      //单位
      unitOptions: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        departmentId: null,
        materialId: null,
        batchNo: null,
      },
      // 表单参数
      form: {},
    };
  },
  mounted() {
    //显示弹窗
    this.show = this.DialogComponentShow
    this.queryParams.departmentId = this.departmentValue
    this.getList();
  },
  created() {
    // this.getList();
  },
  methods: {
    /** 查询高值科室库存信息列表 */
    getList() {
      this.loading = true;
      listGzDepInventory(this.queryParams).then(response => {
        this.inventoryList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
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
    handleSelectionChange(val) {
      //获取选择的行数据
      this.selectRow = val
    },
    handleClose() {
      //关闭弹窗
      this.show = false
      this.$emit('closeDialog')
    },
    checkBtn() {
      //确定按钮
      if(!this.selectRow) {
        this.$message({ message: '请先选择数据', type: 'warning' })
        return
      }
      this.$emit('selectData', this.selectRow)   //发送数据到父组件
      this.handleClose()
    },
  }
};
</script>
