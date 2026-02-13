<template>
  <div v-show="show" class="local-modal-mask">
    <div class="local-modal-content">
      <div class="modal-header">
        <div class="modal-title">耗材明细</div>
        <el-button size="small" @click="handleClose" class="close-btn">关闭</el-button>
      </div>
      <div class="modal-body">
        <el-form :model="queryParams" ref="queryForm" :inline="true" v-show="showSearch" label-width="68px">
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
            <el-form-item label="按供应商过滤" prop="filterBySupplier" label-width="100px">
              <el-radio-group v-model="queryParams.filterBySupplier">
                <el-radio :label="true">是</el-radio>
                <el-radio :label="false">否</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="耗材" prop="materialKeyword" label-width="100px">
              <el-input 
                v-model="queryParams.materialKeyword" 
                placeholder="请输入耗材编码、名称或首字母" 
                clearable 
                @keyup.enter.native="handleQuery"
                @input="handleMaterialKeywordInput"
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
          <el-table-column label="耗材编码" align="center" prop="material.code" width="100" show-overflow-tooltip resizable/>
          <el-table-column label="耗材名称" align="center" prop="material.name" width="150" show-overflow-tooltip resizable/>
          <el-table-column label="规格" align="center" prop="material.speci" width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.speci) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="型号" align="center" prop="material.model" width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.model) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="单位" align="center" width="80" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdUnit && scope.row.material.fdUnit.unitName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="数量" align="center" prop="qty" width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.qty || '--' }}</span>
            </template>
          </el-table-column>
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
          <el-table-column label="计费" align="center" prop="material.isBilling" width="70" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && (scope.row.material.isBilling === '1' || scope.row.material.isBilling === 1)) ? '是' : '否' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="院内码" align="center" prop="inHospitalCode" width="200" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.inHospitalCode || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="生产日期" align="center" prop="materialDate" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.materialDate">{{ formatDate(scope.row.materialDate) }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column label="有效期" align="center" prop="endTime" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.endTime">{{ formatDate(scope.row.endTime) }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column label="批号" align="center" prop="materialNo" width="150" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.materialNo || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="批次号" align="center" prop="batchNo" width="150" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.batchNo || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="库存分类" align="center" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdWarehouseCategory && scope.row.material.fdWarehouseCategory.warehouseCategoryName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="财务分类" align="center" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdFinanceCategory && scope.row.material.fdFinanceCategory.financeCategoryName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="生产厂家" align="center" width="150" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="供应商" align="center" width="150" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.supplier && scope.row.material.supplier.name) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="注册证号" align="center" prop="material.registerNo" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.registerNo) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="注册证有效期" align="center" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.material && scope.row.material.periodDate">
                {{ formatDate(scope.row.material.periodDate) }}
              </span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column label="存储方式" align="center" prop="material.isWay" width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <dict-tag v-if="scope.row.material && scope.row.material.isWay" :options="dict.type.way_status" :value="scope.row.material.isWay"/>
              <span v-else>--</span>
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

    </div>
  </div>
</template>

<script>
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import SelectDepartment from "@/components/SelectModel/SelectDepartment";
import SelectSupplier from "@/components/SelectModel/SelectSupplier";
import SelectWarehouseCategory from "@/components/SelectModel/SelectWarehouseCategory";
import SelectFactory from "@/components/SelectModel/SelectFactory";
import { listDepotInventory} from "@/api/gz/depotInventory";
import { listGzDepInventory} from "@/api/gzDepartment/gzDepInventory";
import { checkInHospitalCode } from "@/api/gz/order";

export default {
  name: "SelectMaterialFilter",
  components: {SelectWarehouse, SelectDepartment, SelectSupplier, SelectWarehouseCategory, SelectFactory},
  dicts: ['way_status'],
  props: {
    DialogComponentShow: Boolean,
    warehouseValue: [Number, String],
    departmentValue: [Number, String],
    supplierValue: [Number, String], // 供应商ID，用于过滤产品
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
      // 定数监测的产品ID列表（用于过滤）
      fixedNumberMaterialIds: [],
      // 定数监测的产品列表（直接显示）
      fixedNumberMaterials: [],
      // 是否使用定数监测模式（有仓库ID且仓库ID来自父组件）
      useFixedNumberMode: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        materialId: null,
        materialName: undefined,
        materialKeyword: undefined, // 耗材搜索关键词（支持编码、名称、首字母）
        warehouseId: undefined,
        departmentId: undefined,
        supplierId: null,
        storeroomId: null, // 库房分类ID
        factoryId: null, // 生产厂家ID
        filterBySupplier: true, // 是否按供应商过滤（默认是）
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
      // 如果有仓库ID，加载该仓库的定数监测产品列表
      if (this.warehouseValue) {
        this.loadFixedNumberMaterials(this.warehouseValue);
      }
    }
    // 如果有供应商ID，设置查询参数（用于过滤）
    if (this.supplierValue) {
      this.queryParams.supplierId = this.supplierValue;
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
          // 如果有仓库ID，加载该仓库的定数监测产品列表
          if (this.warehouseValue) {
            this.loadFixedNumberMaterials(this.warehouseValue);
          }
        }
        // 如果有供应商ID，设置查询参数（用于过滤，但不显示在搜索框中）
        if (this.supplierValue) {
          this.queryParams.supplierId = this.supplierValue;
        }
        this.getList();
      }
    },
    warehouseValue(newVal) {
      // 当父组件传递的仓库值变化时，更新查询参数
      if (!this.useDepInventory && newVal) {
        this.queryParams.warehouseId = newVal;
        // 加载该仓库的定数监测产品列表
        this.loadFixedNumberMaterials(newVal);
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
    /** 加载定数监测的产品列表 */
    loadFixedNumberMaterials(warehouseId) {
      if (!warehouseId) {
        this.fixedNumberMaterialIds = [];
        this.fixedNumberMaterials = [];
        this.useFixedNumberMode = false;
        return;
      }
      
      try {
        // 从localStorage读取定数监测数据（仓库定数监测类型为'1'）
        const storageKey = `fixedNumber_1_${warehouseId}`;
        const savedData = localStorage.getItem(storageKey);
        
        if (savedData) {
          const fixedNumberList = JSON.parse(savedData);
          // 提取所有做了定数监测的产品（只要在列表中就认为是做了定数监测）
          const materials = fixedNumberList
            .filter(item => {
              // 只要在定数监测列表中，就认为是做了定数监测的产品
              return item.material && item.material.id;
            })
            .map(item => {
              // 转换为库存格式，用于显示
              return {
                material: item.material,
                qty: item.stockQuantity || 0, // 库存数量
                unitPrice: item.price || item.material.price || 0, // 单价
                amt: (item.stockQuantity || 0) * (item.price || item.material.price || 0), // 金额
                materialNo: '', // 批号
                batchNo: '', // 批次号
                materialDate: null, // 生产日期
                endTime: null, // 有效期
                inHospitalCode: '', // 院内码
                orderNo: '' // 入库单号
              };
            });
          
          this.fixedNumberMaterials = materials;
          this.fixedNumberMaterialIds = materials.map(m => m.material.id).filter(id => id);
          this.useFixedNumberMode = true;
        } else {
          this.fixedNumberMaterials = [];
          this.fixedNumberMaterialIds = [];
          this.useFixedNumberMode = false;
        }
      } catch (error) {
        console.error('加载定数监测数据失败:', error);
        this.fixedNumberMaterials = [];
        this.fixedNumberMaterialIds = [];
        this.useFixedNumberMode = false;
      }
    },
    /** 查询库存信息列表 */
    getList() {
      // 如果使用定数监测模式，直接显示定数监测的产品列表
      if (this.useFixedNumberMode && this.fixedNumberMaterials.length > 0) {
        this.loading = true;
        let filteredMaterials = this.fixedNumberMaterials;
        
        // 根据供应商过滤（优先使用 props 传入的 supplierValue）
        const supplierId = this.supplierValue || this.queryParams.supplierId;
        if (this.queryParams.filterBySupplier && supplierId) {
          filteredMaterials = filteredMaterials.filter(item => {
            return item.material && item.material.supplierId == supplierId;
          });
        }
        
        // 根据库房分类过滤
        if (this.queryParams.storeroomId) {
          filteredMaterials = filteredMaterials.filter(item => {
            return item.material && item.material.storeroomId == this.queryParams.storeroomId;
          });
        }
        
        // 根据生产厂家过滤
        if (this.queryParams.factoryId) {
          filteredMaterials = filteredMaterials.filter(item => {
            return item.material && item.material.factoryId == this.queryParams.factoryId;
          });
        }
        
        // 根据耗材关键词过滤（支持编码、名称、首字母）
        if (this.queryParams.materialKeyword) {
          const keyword = this.queryParams.materialKeyword.toLowerCase().trim();
          filteredMaterials = filteredMaterials.filter(item => {
            if (!item.material) return false;
            const material = item.material;
            // 检查编码
            if (material.code && material.code.toLowerCase().includes(keyword)) {
              return true;
            }
            // 检查名称
            if (material.name && material.name.toLowerCase().includes(keyword)) {
              return true;
            }
            // 检查首字母（名称简码）
            if (material.referredName && material.referredName.toLowerCase().includes(keyword)) {
              return true;
            }
            return false;
          });
        }
        
        // 分页处理
        const start = (this.queryParams.pageNum - 1) * this.queryParams.pageSize;
        const end = start + this.queryParams.pageSize;
        this.materialList = filteredMaterials.slice(start, end);
        this.total = filteredMaterials.length;
        this.loading = false;
        return;
      }
      
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
        let materialList = response.rows || [];
        
        // 如果有定数监测产品ID列表，只显示这些产品的库存
        if (!this.useDepInventory && this.fixedNumberMaterialIds.length > 0) {
          materialList = materialList.filter(item => {
            const materialId = item.material && item.material.id;
            return materialId && this.fixedNumberMaterialIds.includes(materialId);
          });
        }
        
        // 根据供应商过滤（优先使用 props 传入的 supplierValue）
        const supplierId = this.supplierValue || this.queryParams.supplierId;
        if (this.queryParams.filterBySupplier && supplierId) {
          materialList = materialList.filter(item => {
            return item.material && item.material.supplierId == supplierId;
          });
        }
        
        // 根据库房分类过滤
        if (this.queryParams.storeroomId) {
          materialList = materialList.filter(item => {
            return item.material && item.material.storeroomId == this.queryParams.storeroomId;
          });
        }
        
        // 根据生产厂家过滤
        if (this.queryParams.factoryId) {
          materialList = materialList.filter(item => {
            return item.material && item.material.factoryId == this.queryParams.factoryId;
          });
        }
        
        // 根据耗材关键词过滤（支持编码、名称、首字母）
        if (this.queryParams.materialKeyword) {
          const keyword = this.queryParams.materialKeyword.toLowerCase().trim();
          materialList = materialList.filter(item => {
            if (!item.material) return false;
            const material = item.material;
            // 检查编码
            if (material.code && material.code.toLowerCase().includes(keyword)) {
              return true;
            }
            // 检查名称
            if (material.name && material.name.toLowerCase().includes(keyword)) {
              return true;
            }
            // 检查首字母（名称简码）
            if (material.referredName && material.referredName.toLowerCase().includes(keyword)) {
              return true;
            }
            return false;
          });
        }
        
        this.materialList = materialList;
        this.total = materialList.length;
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
      this.queryParams.materialKeyword = undefined;
      this.queryParams.storeroomId = null;
      this.queryParams.factoryId = null;
      this.queryParams.filterBySupplier = true;
      // 保留仓库ID或科室ID，不重置
      this.handleQuery();
    },
    /** 耗材关键词输入处理 */
    handleMaterialKeywordInput(value) {
      // 实时搜索可以在这里实现，或者保持为空，只在点击搜索时查询
      // 如果需要实时搜索，可以调用 this.handleQuery()
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
    /** 格式化金额 */
    formatCurrency(value) {
      if (!value && value !== 0) return '--';
      return parseFloat(value).toFixed(2);
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
  overflow-x: auto;
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
  min-width: 100%;
}

/* 确保表格可以左右滚动 */
.el-table__body-wrapper {
  overflow-x: auto;
  overflow-y: auto;
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
