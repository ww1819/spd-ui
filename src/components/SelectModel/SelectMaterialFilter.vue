<template>
  <div v-show="show" class="local-modal-mask">
    <div class="local-modal-content">
      <div class="modal-header">
        <div class="modal-title">耗材明细</div>
        <el-button icon="el-icon-close" size="small" circle @click="handleClose" class="close-btn"></el-button>
      </div>
      <div class="modal-body">
        <el-form :model="queryParams" ref="queryForm" :inline="true" v-show="showSearch" label-width="68px">
        <el-row :gutter="20">

          <el-col :span="6">
            <el-form-item :label="useDepInventory ? '科室' : '仓库'" :prop="useDepInventory ? 'departmentId' : 'warehouseId'" label-width="100px">
              <SelectDepartment v-if="useDepInventory" v-model="queryParams.departmentId" :value2="true"/>
              <SelectWarehouse v-else v-model="queryParams.warehouseId" :value2="true" includeWarehouseType="高值"/>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="供应商" prop="supplierId" label-width="100px">
              <SelectSupplier v-model="queryParams.supplierId"/>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="耗材" prop="materialName" label-width="100px">
              <el-input v-model="queryParams.materialName" placeholder="请输入耗材名称" clearable @keyup.enter.native="handleQuery"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item>
              <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery">搜索</el-button>
              <el-button icon="el-icon-refresh" size="small" @click="resetQuery">重置</el-button>
              <el-button size="small" @click="handleClose">取 消</el-button>
              <el-button type="primary" size="small" @click="checkMaterialBtn">确 定</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

        <el-table ref="singleTable" :data="materialList" @selection-change="handleSelectionChange" height="calc(50vh)" border>
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column label="序号" align="center" width="80" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
            </template>
          </el-table-column>
          <el-table-column label="耗材编码" align="center" prop="material.code" width="80" show-overflow-tooltip resizable/>
          <el-table-column label="耗材名称" align="center" prop="material.name" width="160" show-overflow-tooltip resizable/>
          <el-table-column label="供应商" align="center" width="160" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.supplier && scope.row.material.supplier.name) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="库存数量" align="center" prop="qty" width="100" show-overflow-tooltip resizable/>
          <el-table-column label="单价" align="center" prop="unitPrice" width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.unitPrice">{{ scope.row.unitPrice | formatCurrency}}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column label="金额" align="center" prop="amt" width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.amt">{{ scope.row.amt | formatCurrency}}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column label="批号" align="center" prop="materialNo" width="120" show-overflow-tooltip resizable/>
          <el-table-column label="批次号" align="center" prop="batchNo" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="生产日期" align="center" prop="materialDate" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.materialDate">{{ parseTime(scope.row.materialDate, '{y}-{m}-{d}') }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column label="有效期" align="center" prop="endTime" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.endTime">{{ parseTime(scope.row.endTime, '{y}-{m}-{d}') }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column label="院内码" align="center" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.inHospitalCode || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="useDepInventory ? '出库单号' : '入库单号'" align="center" :prop="useDepInventory ? 'shipmentNo' : 'orderNo'" width="180" show-overflow-tooltip resizable/>
        </el-table>

        <pagination
          v-show="total>0"
          :total="total"
          :page.sync="queryParams.pageNum"
          :limit.sync="queryParams.pageSize"
          @pagination="getList"
        />
      </div>

    </div>
  </div>
</template>

<script>
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import SelectDepartment from "@/components/SelectModel/SelectDepartment";
import SelectSupplier from "@/components/SelectModel/SelectSupplier";
import { listDepotInventory} from "@/api/gz/depotInventory";
import { listGzDepInventory} from "@/api/gzDepartment/gzDepInventory";
import { checkInHospitalCode } from "@/api/gz/order";

export default {
  name: "SelectMaterialFilter",
  components: {SelectWarehouse, SelectDepartment, SelectSupplier},
  dicts: ['way_status'],
  props: {
    DialogComponentShow: Boolean,
    warehouseValue: [Number, String],
    departmentValue: [Number, String],
    gzOrderEntryList: Array,
    useDepInventory: { // 是否使用科室库存（true=科室库存，false=仓库库存）
      type: Boolean,
      default: false
    }
  },
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
        materialId: null,
        materialName: undefined,
        warehouseId: undefined,
        departmentId: undefined,
        supplierId: null,
      },
      // 表单参数
      form: {},
    };
  },
  mounted() {
    //显示弹窗
    this.show = this.DialogComponentShow
    if (this.useDepInventory) {
      this.queryParams.departmentId = this.departmentValue;
    } else {
      this.queryParams.warehouseId = this.warehouseValue;
    }
    this.getList();
  },
  watch: {
    DialogComponentShow(newVal) {
      this.show = newVal;
      if (newVal) {
        // 弹窗打开时更新仓库/科室并重新加载数据
        if (this.useDepInventory) {
          this.queryParams.departmentId = this.departmentValue;
        } else {
          this.queryParams.warehouseId = this.warehouseValue;
        }
        this.getList();
      }
    },
    warehouseValue(newVal) {
      // 当父组件传递的仓库值变化时，更新查询参数
      if (!this.useDepInventory && newVal) {
        this.queryParams.warehouseId = newVal;
      }
    },
    departmentValue(newVal) {
      // 当父组件传递的科室值变化时，更新查询参数
      if (this.useDepInventory && newVal) {
        this.queryParams.departmentId = newVal;
      }
    }
  },
  created() {
    // this.getList();
  },
  methods: {
    /** 查询库存信息列表 */
    getList() {
      // 根据 useDepInventory 判断使用哪个查询条件
      if (this.useDepInventory) {
        if (!this.queryParams.departmentId) {
          this.loading = false;
          return;
        }
      } else {
        if (!this.queryParams.warehouseId) {
          this.loading = false;
          return;
        }
      }
      this.loading = true;
      // 根据 useDepInventory 决定使用哪个 API
      const apiCall = this.useDepInventory ? listGzDepInventory(this.queryParams) : listDepotInventory(this.queryParams);
      apiCall.then(response => {
        this.materialList = response.rows;
        this.total = response.total;
        this.loading = false;
      }).catch(() => {
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
      this.queryParams.materialName = undefined;
      this.queryParams.supplierId = null;
      // 保留仓库ID或科室ID，不重置
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
    async checkMaterialBtn() {
      //确定按钮
      if(!this.selectRow || this.selectRow.length === 0) {
        this.$message({ message: '请先选择数据', type: 'warning' })
        return
      }
      
      // 检查选择的明细是否有未出库的出库单
      const invalidItems = [];
      for (let i = 0; i < this.selectRow.length; i++) {
        const item = this.selectRow[i];
        const inHospitalCode = item.inHospitalCode;
        if (inHospitalCode) {
          try {
            const response = await checkInHospitalCode({ inHospitalCode: inHospitalCode });
            if (response.code === 200 && response.data && response.data.length > 0) {
              invalidItems.push({
                index: i + 1,
                inHospitalCode: inHospitalCode,
                materialName: (item.material && item.material.name) || item.materialName || '未知',
                orderNos: response.data
              });
            }
          } catch (error) {
            console.error('检查院内码失败:', error);
          }
        }
      }
      
      if (invalidItems.length > 0) {
        let message = '以下明细已有未出库的出库单，不能选择：\n';
        invalidItems.forEach(item => {
          message += `第${item.index}行：${item.materialName}（院内码：${item.inHospitalCode}），出库单号：${item.orderNos.join('、')}\n`;
        });
        this.$message({ 
          message: message, 
          type: 'error',
          duration: 5000,
          dangerouslyUseHTMLString: false
        });
        return;
      }
      
      // 检查选择的明细中是否有院内码已经在父组件的明细列表中
      const duplicateItems = [];
      if (this.gzOrderEntryList && this.gzOrderEntryList.length > 0) {
        for (let i = 0; i < this.selectRow.length; i++) {
          const item = this.selectRow[i];
          const inHospitalCode = item.inHospitalCode || "";
          if (inHospitalCode) {
            // 检查父组件的明细列表中是否已存在相同的院内码
            const exists = this.gzOrderEntryList.some(entry => entry.inHospitalCode === inHospitalCode);
            if (exists) {
              const materialName = (item.material && item.material.name) || item.materialName || '未知';
              duplicateItems.push({
                index: i + 1,
                materialName: materialName,
                inHospitalCode: inHospitalCode
              });
            }
          }
        }
      }
      
      // 如果有重复的院内码，提示用户但不关闭弹窗，让用户继续选择
      if (duplicateItems.length > 0) {
        let message = '请勿重复添加，以下明细的院内码已存在于当前明细列表中：\n\n';
        duplicateItems.forEach(item => {
          message += `第${item.index}行：${item.materialName}（院内码：${item.inHospitalCode}）\n`;
        });
        message += '\n请继续选择其他产品。';
        this.$message({ 
          message: message, 
          type: 'error',
          duration: 5000,
          dangerouslyUseHTMLString: false
        });
        return; // 不关闭弹窗，让用户继续选择
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
  height: 100vh;
  max-height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
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
