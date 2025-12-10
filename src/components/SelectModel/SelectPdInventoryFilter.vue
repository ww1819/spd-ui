<template>
  <div class="app-container">
    <el-dialog title="库存明细" :visible.sync="show" append-to-body width="1600px" :before-close="handleClose">
      <el-form :model="queryParams" ref="queryForm" :inline="true" v-show="showSearch" label-width="68px">
        <el-row :gutter="20">

          <el-col :span="6">
            <el-form-item label="仓库" prop="warehouseId" label-width="100px">
              <SelectWarehouse v-model="queryParams.warehouseId" :value2="isShow"/>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="耗材" prop="materialId" label-width="100px">
              <SelectMaterial v-model="queryParams.materialId" />
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="入库批次号" prop="batchNo" label-width="100px">
              <el-input
                v-model="queryParams.batchNo"
                placeholder="请输入入库批次号"
                clearable
                @keyup.enter.native="handleQuery"
              />
            </el-form-item>
          </el-col>

        </el-row>

        <el-row :gutter="24">
          <el-col :span="6">
            <el-form-item>
              <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery">搜索</el-button>
              <el-button icon="el-icon-refresh" size="small" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

<!--      <el-table ref="singleTable" :data="inventoryList" @selection-change="handleSelectionChange">-->
      <el-table ref="singleTable" :data="inventoryList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="耗材" align="center" prop="material.name" width="120"/>
        <el-table-column label="仓库" align="center" prop="warehouse.name" width="120"/>
        <el-table-column label="供应商" align="center" prop="supplier.name" width="160"/>
        <el-table-column label="库存数量" align="center" prop="qty" width="80"/>
        <el-table-column label="单价" align="center" prop="unitPrice" width="120"/>
        <el-table-column label="金额" align="center" prop="amt" width="120"/>
        <el-table-column label="入库批次号" align="center" prop="batchNo" width="200"/>
        <el-table-column label="耗材批次号" align="center" prop="materialNo" width="200"/>
        <el-table-column label="耗材日期" align="center" prop="materialDate" width="140">
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.materialDate, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="入库日期" align="center" prop="warehouseDate" width="140">
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
import { listPDFilter } from "@/api/warehouse/inventory";
import SelectMaterial from "@/components/SelectModel/SelectMaterial";
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import SelectSupplier from "@/components/SelectModel/SelectSupplier";

export default {
  name: "SelectInventory",
  components: {SelectMaterial,SelectWarehouse,SelectSupplier},
  props: ['DialogComponentShow','warehouseValue','supplierValue'], //接受父组件传递过来的数据
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
      // 库存信息表格数据
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
        warehouseId: null,
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
    this.queryParams.warehouseId = this.warehouseValue
    this.getList();
  },
  created() {
    // this.getList();
  },
  methods: {
    /** 查询库存信息列表 */
    getList() {
      this.loading = true;
      listPDFilter(this.queryParams).then(response => {
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
