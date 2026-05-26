<template>
  <div v-show="show" class="local-modal-mask">
    <div class="local-modal-content">
      <div class="modal-header">
        <div class="modal-title">添加产品明细</div>
        <el-button type="text" @click="handleClose" class="close-btn" style="font-size:14px;padding:0;color:#909399;">关闭</el-button>
      </div>
      <div class="modal-body">
        <el-form :model="queryParams" ref="queryForm" :inline="true" v-show="showSearch" label-width="0" class="query-form">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="库房分类" prop="storeroomId" label-width="100px">
              <SelectWarehouseCategory v-model="queryParams.storeroomId"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="生产厂家" prop="factoryId" label-width="100px">
              <SelectFactory v-model="queryParams.factoryId"/>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="耗材" prop="name" label-width="100px">
              <el-input 
                v-model="queryParams.name" 
                placeholder="耗材编码、名称或首字母" 
                clearable 
                @keyup.enter.native="handleQuery"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <!-- 搜索和重置按钮放在搜索框和明细框中间，靠左显示 -->
      <div style="text-align: left; margin: 10px 0;">
        <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="small" @click="resetQuery">重置</el-button>
        <el-button size="small" @click="handleClose" style="margin-left: 20px;">取 消</el-button>
        <el-button type="primary" size="small" @click="checkMaterialBtn">确 定</el-button>
      </div>

        <el-table ref="singleTable" :data="materialList" @selection-change="handleSelectionChange" height="calc(50vh)" border :cell-style="{padding: '8px 4px'}">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column label="序号" align="center" width="60" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
            </template>
          </el-table-column>
          <el-table-column label="耗材编码" align="center" prop="code" width="100" show-overflow-tooltip resizable/>
          <el-table-column label="耗材名称" align="center" prop="name" width="150" show-overflow-tooltip resizable/>
          <el-table-column label="规格" align="center" prop="speci" width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.speci || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="型号" align="center" prop="model" width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.model || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="单位" align="center" width="80" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.fdUnit && scope.row.fdUnit.unitName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="单价" align="center" prop="price" width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.price">{{ scope.row.price | formatCurrency}}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column label="计费" align="center" prop="isBilling" width="70" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.isBilling === '1' || scope.row.isBilling === 1) ? '是' : '否' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="库存分类" align="center" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.fdWarehouseCategory && scope.row.fdWarehouseCategory.warehouseCategoryName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="财务分类" align="center" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.fdFinanceCategory && scope.row.fdFinanceCategory.financeCategoryName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="生产厂家" align="center" width="150" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.fdFactory && scope.row.fdFactory.factoryName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="供应商" align="center" width="150" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.supplier && scope.row.supplier.name) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="注册证号" align="center" prop="registerNo" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.registerNo || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="注册证有效期" align="center" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.periodDate">
                {{ formatDate(scope.row.periodDate) }}
              </span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column label="存储方式" align="center" prop="isWay" width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <dict-tag v-if="scope.row.isWay" :options="dict.type.way_status" :value="scope.row.isWay"/>
              <span v-else>--</span>
            </template>
          </el-table-column>
      </el-table>

      <div class="pagination-container">
        <pagination
          :total="total"
          :page.sync="queryParams.pageNum"
          :limit.sync="queryParams.pageSize"
          @pagination="handlePagination"
        />
      </div>
      </div>
    </div>
  </div>
</template>

<script>
import SelectWarehouseCategory from "@/components/SelectModel/SelectWarehouseCategory";
import SelectFactory from "@/components/SelectModel/SelectFactory";
import { listMaterialPurchasePlanPickPost, listMaterialDeptSafe } from "@/api/foundation/material";
import { isForbiddenError } from "@/utils/requestFallback";

export default {
  name: "SelectMaterialFilter",
  components: {SelectWarehouseCategory, SelectFactory},
  dicts: ['way_status'],
  props: {
    DialogComponentShow: Boolean,
    supplierValue: [String, Number],
    warehouseValue: [Number, String],
    /** 当前单据明细中已存在的产品档案 id，用于后端 m.id not in (...) 排除，避免重复添加 */
    excludeMaterialIds: {
      type: Array,
      default() {
        return [];
      }
    },
    /** 高值/低值过滤：1高值 2低值 */
    isGzValue: {
      type: [String, Number],
      default: null
    }
  },
  data() {
    return {
      // 遮罩层
      show: false, //弹窗默认隐藏
      selectRow: [], //选择的行数据
      isShow: true,//是否显示
      isDisabled: false,//是否禁用
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
        storeroomId: null, // 库房分类ID
        factoryId: null, // 生产厂家ID
      },
      // 表单参数
      form: {},
      /** 无采购计划/产品 list 权限时降级科室低敏接口：全量在前端分页 */
      deptSafePagingMode: false,
      deptSafeAllRows: [],
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
    },
    warehouseValue() {
      if (this.show) {
        this.queryParams.pageNum = 1;
        this.getList();
      }
    },
    isGzValue() {
      if (this.show) {
        this.queryParams.pageNum = 1;
        this.getList();
      }
    },
    excludeMaterialIds: {
      deep: true,
      handler() {
        if (this.show) {
          this.queryParams.pageNum = 1;
          this.getList();
        }
      }
    }
  },
  created() {
    // this.getList();
  },
  methods: {
    applyDeptSafeClientPage() {
      const all = this.deptSafeAllRows || [];
      this.total = all.length;
      const start = (this.queryParams.pageNum - 1) * this.queryParams.pageSize;
      const end = start + this.queryParams.pageSize;
      this.materialList = all.slice(start, end);
    },
    loadDeptSafeMaterials() {
      const q = { ...this.queryParams };
      delete q.pageNum;
      delete q.pageSize;
      return listMaterialDeptSafe(q).then(response => {
        const materialList = Array.isArray(response) ? response : [];
        if (this.deptSafePagingMode) {
          this.deptSafeAllRows = materialList;
          this.applyDeptSafeClientPage();
        } else {
          this.materialList = materialList;
          this.total = materialList.length;
        }
        this.loading = false;
      });
    },
    /** 采购计划选耗材：低敏分页接口请求体 */
    buildPurchasePlanPickBody() {
      const q = {
        warehouseId: this.warehouseValue || undefined,
        storeroomId: this.queryParams.storeroomId,
        factoryId: this.queryParams.factoryId,
        name: this.queryParams.name,
        supplierId: this.queryParams.supplierId || undefined
      };
      if (this.isGzValue != null && this.isGzValue !== '') {
        q.isGz = String(this.isGzValue);
      }
      const exclude = (this.excludeMaterialIds || []).filter(
        id => id !== null && id !== undefined && id !== ""
      );
      if (exclude.length > 0) {
        q.excludeMaterialIds = [...new Set(exclude.map(id => String(id)))].join(",");
      }
      return {
        pageNum: this.queryParams.pageNum,
        pageSize: this.queryParams.pageSize,
        query: q
      };
    },
    /** 查询耗材信息列表（服务端分页；已选明细通过 excludeMaterialIds 在后端排除） */
    getList() {
      this.loading = true;
      this.deptSafePagingMode = false;
      this.deptSafeAllRows = [];
      listMaterialPurchasePlanPickPost(this.buildPurchasePlanPickBody())
        .then(response => {
          this.materialList = response.rows || [];
          this.total = response.total != null ? Number(response.total) : 0;
          this.loading = false;
        })
        .catch(error => {
          if (isForbiddenError(error)) {
            this.deptSafePagingMode = true;
            this.loadDeptSafeMaterials().catch(() => {
              this.loading = false;
            });
            return;
          }
          console.error("查询耗材列表失败:", error);
          this.loading = false;
        });
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 分页变化 */
    handlePagination(pagination) {
      if (pagination) {
        this.queryParams.pageNum = pagination.page;
        this.queryParams.pageSize = pagination.limit;
      }
      if (this.deptSafePagingMode) {
        this.applyDeptSafeClientPage();
      } else {
        this.getList();
      }
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
    /** 格式化日期 */
    formatDate(date) {
      if (!date) return '--';
      if (typeof date === 'string') {
        // 如果是字符串，尝试解析
        const d = new Date(date);
        if (isNaN(d.getTime())) {
          // 如果解析失败，直接返回原字符串（可能是已格式化的日期）
          return date;
        }
        date = d;
      }
      if (date instanceof Date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      return '--';
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
  width: 100vw;
  height: 100vh;
  min-width: 100vw;
  min-height: 100vh;
  background: rgba(0,0,0,0.4);
  z-index: 3000;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
  overflow: hidden;
}

.local-modal-content {
  background: #fff;
  width: 100%;
  height: 100%;
  max-height: 100vh;
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

/* 分页容器样式 */
.pagination-container {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #EBEEF5;
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
}

.modal-footer {
  padding: 16px 24px;
  text-align: right;
  border-top: 1px solid #EBEEF5;
  background: #F5F7FA;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
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
