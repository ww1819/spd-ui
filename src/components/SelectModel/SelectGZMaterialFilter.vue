<template>
  <div class="app-container">
    <el-dialog title="耗材明细" :visible.sync="show" append-to-body width="1600px" :before-close="handleClose">
      <el-form :model="queryParams" ref="queryForm" :inline="true" v-show="showSearch" label-width="68px">
        <el-row :gutter="20">

          <el-col :span="6">
            <el-form-item label="供应商" prop="supplierId" label-width="100px">
              <SelectSupplier v-model="queryParams.supplierId" :value2="isDisabled"/>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="耗材" prop="id" label-width="100px">
              <SelectMaterial v-model="queryParams.id" />
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

      <el-table ref="singleTable" :data="materialList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="耗材编码" align="center" prop="code" width="80"/>
        <el-table-column label="耗材名称" align="center" prop="name" width="160"/>
        <el-table-column label="供应商" align="center" prop="supplier.name" width="160"/>
        <el-table-column label="规格" align="center" prop="speci" width="100"/>
        <el-table-column label="型号" align="center" prop="model" width="100"/>
        <el-table-column label="价格" align="center" prop="price" width="100"/>
        <el-table-column label="有效期" align="center" prop="periodDate" width="100"/>
        <el-table-column label="生产厂家" align="center" prop="fdFactory.factoryName" width="160"/>
        <el-table-column label="库房分类" align="center" prop="fdWarehouseCategory.warehouseCategoryName" width="160"/>

      </el-table>

      <span slot="footer" class="dialog-footer">
          <el-button @click="handleClose">取 消</el-button>
          <el-button type="primary" @click="checkMaterialBtn">确 定</el-button>
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
import SelectMaterial from "@/components/SelectModel/SelectMaterial";
import SelectSupplier from "@/components/SelectModel/SelectSupplier";
import { listMaterial} from "@/api/foundation/material";

export default {
  name: "SelectMaterialFilter",
  components: {SelectMaterial},
  props: ['DialogComponentShow','supplierValue'], //接受父组件传递过来的数据
  data() {
    return {
      // 遮罩层
      show: false, //弹窗默认隐藏
      selectRow: [], //选择的行数据
      isShow: true,//是否显示
      isDisabled: true,//是否禁用
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
      // 耗材信息表格数据
      materialList: [],
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
        id: null,
        code: undefined,
        name: undefined,
        supplierId: undefined,
        speci: undefined,
        model: undefined,
        price: undefined,
        isGz: undefined,
      },
      // 表单参数
      form: {},
    };
  },
  mounted() {
    //显示弹窗
    this.show = this.DialogComponentShow
    this.queryParams.supplierId = this.supplierValue
    this.getList();
  },
  created() {
    // this.getList();
  },
  methods: {
    /** 查询耗材信息列表 */
    getList() {
      this.loading = true;
      this.queryParams.isGz = '1';
      listMaterial(this.queryParams).then(response => {
        this.materialList = response.rows;
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
    checkMaterialBtn() {
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
