<template>
  <div v-show="show" class="local-modal-mask">
    <div class="local-modal-content">
      <div class="modal-header">
        <div class="modal-title">耗材明细</div>
        <el-button icon="el-icon-close" size="mini" circle @click="handleClose" class="close-btn"></el-button>
      </div>
      <div class="modal-body">
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

        <el-table ref="singleTable" :data="materialList" @selection-change="handleSelectionChange" height="calc(42vh)" border>
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column label="耗材编码" align="center" prop="code" width="80" show-overflow-tooltip resizable/>
          <el-table-column label="耗材名称" align="center" prop="name" width="160" show-overflow-tooltip resizable/>
          <el-table-column label="供应商" align="center" prop="supplier.name" width="160" show-overflow-tooltip resizable/>
          <el-table-column label="规格" align="center" prop="speci" width="100" show-overflow-tooltip resizable/>
          <el-table-column label="型号" align="center" prop="model" width="100" show-overflow-tooltip resizable/>
          <el-table-column label="价格" align="center" prop="price" width="100" show-overflow-tooltip resizable/>
          <el-table-column label="有效期" align="center" prop="periodDate" width="100" show-overflow-tooltip resizable/>
          <el-table-column label="生产厂家" align="center" prop="fdFactory.factoryName" width="160" show-overflow-tooltip resizable/>
          <el-table-column label="库房分类" align="center" prop="fdWarehouseCategory.warehouseCategoryName" width="160"/>
          <el-table-column label="财务分类" align="center" prop="fdFinanceCategory.financeCategoryName" width="160"/>
          <el-table-column label="单位" align="center" prop="fdUnit.unitName" width="160"/>
          <el-table-column label="注册证号" align="center" prop="registerNo" width="160"/>
          <el-table-column label="包装规格" align="center" prop="packageSpeci" width="160"/>
          <el-table-column label="材质" align="center" prop="quality" width="160"/>
          <el-table-column label="储存方式" align="center" prop="isWay" width="160">
            <template slot-scope="scope">
              <dict-tag :options="dict.type.way_status" :value="scope.row.isWay"/>
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

      <div class="modal-footer">
        <el-button @click="handleClose">取 消</el-button>
        <el-button type="primary" @click="checkMaterialBtn">确 定</el-button>
      </div>
    </div>
  </div>
</template>

<script>
import SelectMaterial from "@/components/SelectModel/SelectMaterial";
import SelectSupplier from "@/components/SelectModel/SelectSupplier";
import { listMaterial} from "@/api/foundation/material";

export default {
  name: "SelectMaterialFilter",
  components: {SelectMaterial},
  dicts: ['way_status'],
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
  watch: {
    DialogComponentShow(newVal) {
      this.show = newVal;
      if (newVal) {
        // 弹窗打开时更新供应商并重新加载数据
        this.queryParams.supplierId = this.supplierValue;
        this.getList();
      }
    }
  },
  created() {
    // this.getList();
  },
  methods: {
    /** 查询耗材信息列表 */
    getList() {
      this.loading = true;
      this.queryParams.isGz = '2';
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

<style scoped>
/* 内部弹窗样式 - 占满整个遮罩层 */
.local-modal-mask {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.4);
  z-index: 2000;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
}

.local-modal-content {
  background: #fff;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #EBEEF5;
  background: #F5F7FA;
  flex-shrink: 0;
  min-height: 48px;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

.close-btn {
  border: none;
  background: transparent;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  background: #fff;
}

.modal-footer {
  padding: 16px 24px;
  text-align: right;
  border-top: 1px solid #EBEEF5;
  background: #F5F7FA;
  flex-shrink: 0;
}

.modal-footer .el-button {
  margin-left: 12px;
}

/* 表格样式优化 */
.el-table {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

.el-table th {
  background-color: #F5F7FA !important;
  color: #606266;
  font-weight: 500;
  height: 50px;
  padding: 8px 0;
  border-bottom: 1px solid #EBEEF5;
}

.el-table td {
  padding: 12px 0;
  color: #606266;
  border-bottom: 1px solid #EBEEF5;
}

.el-table tr:hover > td {
  background-color: #F5F7FA !important;
  transition: all 0.3s;
}

/* 搜索表单样式 */
.el-form {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

.el-form .el-form-item {
  margin-bottom: 15px;
}
</style>
