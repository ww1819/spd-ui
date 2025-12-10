<template>
  <transition name="modal-fade">
    <div v-if="show" class="local-modal-mask">
      <transition name="modal-zoom">
        <div v-if="show" class="local-modal-content">
          <div class="modal-header">
            <div class="modal-title">选择耗材产品</div>
            <el-button icon="el-icon-close" size="small" circle @click="handleClose" class="close-btn"></el-button>
          </div>
          <div class="modal-body">
            <el-form :model="queryParams" ref="queryForm" :inline="true" v-show="showSearch" label-width="68px">
              <el-row :gutter="20">
                <el-col :span="6">
                  <el-form-item label="耗材编码" prop="code" label-width="100px">
                    <el-input
                      v-model="queryParams.code"
                      placeholder="请输入耗材编码"
                      clearable
                      @keyup.enter.native="handleQuery"
                    />
                  </el-form-item>
                </el-col>

                <el-col :span="6">
                  <el-form-item label="耗材名称" prop="name" label-width="100px">
                    <el-input
                      v-model="queryParams.name"
                      placeholder="请输入耗材名称"
                      clearable
                      @keyup.enter.native="handleQuery"
                    />
                  </el-form-item>
                </el-col>

                <el-col :span="6">
                  <el-form-item label="供应商" prop="supplierId" label-width="100px">
                    <SelectSupplier v-model="queryParams.supplierId"/>
                  </el-form-item>
                </el-col>

                <el-col :span="6">
                  <el-form-item label="品牌" prop="brand" label-width="100px">
                    <el-input
                      v-model="queryParams.brand"
                      placeholder="请输入品牌"
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

            <el-table ref="singleTable" :data="materialList" @selection-change="handleSelectionChange" height="calc(42vh)" border>
              <el-table-column type="selection" width="55" align="center" />
              <el-table-column label="耗材编码" align="center" prop="code" width="120" show-overflow-tooltip resizable/>
              <el-table-column label="耗材名称" align="center" prop="name" width="150" show-overflow-tooltip resizable/>
              <el-table-column label="规格" align="center" prop="speci" width="120" show-overflow-tooltip resizable/>
              <el-table-column label="型号" align="center" prop="model" width="120" show-overflow-tooltip resizable/>
              <el-table-column label="单位" align="center" prop="unit.name" width="80" show-overflow-tooltip resizable/>
              <el-table-column label="参考单价" align="center" prop="prince" width="100" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span>¥{{ scope.row.prince }}</span>
                </template>
              </el-table-column>
              <el-table-column label="品牌" align="center" prop="brand" width="120" show-overflow-tooltip resizable/>
              <el-table-column label="供应商" align="center" prop="supplier.name" width="160" show-overflow-tooltip resizable/>
              <el-table-column label="生产厂家" align="center" prop="producer" width="160" show-overflow-tooltip resizable/>
              <el-table-column label="注册证号" align="center" prop="register_no" width="150" show-overflow-tooltip resizable/>
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
            <el-button type="primary" @click="checkBtn">确 定</el-button>
          </div>
        </div>
      </transition>
    </div>
  </transition>
</template>

<script>
import { listMaterial } from "@/api/foundation/material";
import SelectSupplier from "@/components/SelectModel/SelectSupplier";

export default {
  name: "SelectMaterialForPurchase",
  components: {SelectSupplier},
  props: ['DialogComponentShow'], //接受父组件传递过来的数据
  data() {
    return {
      // 遮罩层
      show: false, //弹窗默认隐藏
      selectRow: [], //选择的行数据
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
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        code: null,
        name: null,
        supplierId: null,
        brand: null,
        isGz: '2' // 普通耗材
      },
      // 表单参数
      form: {},
    };
  },
  mounted() {
    //显示弹窗
    this.show = this.DialogComponentShow
    this.getList();
  },
  created() {
    // this.getList();
  },
  methods: {
    /** 查询耗材信息列表 */
    getList() {
      this.loading = true;
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
    checkBtn() {
      //确定按钮
      if(!this.selectRow || this.selectRow.length === 0) {
        this.$message({ message: '请先选择耗材产品', type: 'warning' })
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

/* 弹窗动画效果 */
.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter, .modal-fade-leave-to {
  opacity: 0;
}

.modal-zoom-enter-active, .modal-zoom-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  transform-origin: center center;
}

.modal-zoom-enter {
  opacity: 0;
  transform: scale(0.3) translateY(-50px);
}

.modal-zoom-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
</style>
