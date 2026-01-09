<template>
  <div v-show="show" class="local-modal-mask">
    <div class="local-modal-content">
      <div class="modal-header">
        <div class="modal-title">添加产品明细</div>
        <el-button type="text" @click="handleClose" class="close-btn" style="font-size:14px;padding:0;color:#909399;">关闭</el-button>
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
            <el-form-item label="耗材" prop="name" label-width="100px">
              <el-input 
                v-model="queryParams.name" 
                placeholder="请输入耗材编码、名称或首字母" 
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
import SelectSupplier from "@/components/SelectModel/SelectSupplier";
import SelectWarehouseCategory from "@/components/SelectModel/SelectWarehouseCategory";
import SelectFactory from "@/components/SelectModel/SelectFactory";
import { listMaterial, listMaterialAll} from "@/api/foundation/material";

export default {
  name: "SelectMaterialFilter",
  components: {SelectWarehouseCategory, SelectFactory},
  dicts: ['way_status'],
  props: ['DialogComponentShow','supplierValue','warehouseValue'], //接受父组件传递过来的数据
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
      // 所有过滤后的耗材数据（用于客户端分页）
      allFilteredMaterials: [],
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
      // 定数监测的产品ID列表（用于过滤）
      fixedNumberMaterialIds: [],
    };
  },
  mounted() {
    //显示弹窗
    this.show = this.DialogComponentShow
    this.queryParams.supplierId = this.supplierValue
    // 如果有仓库ID，加载定数监测的产品列表
    if (this.warehouseValue) {
      console.log('mounted - warehouseValue:', this.warehouseValue, '类型:', typeof this.warehouseValue);
      this.loadFixedNumberMaterials(this.warehouseValue);
    } else {
      console.log('mounted - 没有warehouseValue');
    }
    this.getList();
  },
  watch: {
    DialogComponentShow(newVal) {
      this.show = newVal;
      if (newVal) {
        // 弹窗打开时更新供应商并重新加载数据
        this.queryParams.supplierId = this.supplierValue;
        // 如果有仓库ID，加载定数监测的产品列表
        if (this.warehouseValue) {
          console.log('DialogComponentShow - warehouseValue:', this.warehouseValue, '类型:', typeof this.warehouseValue);
          this.loadFixedNumberMaterials(this.warehouseValue);
        } else {
          console.log('DialogComponentShow - 没有warehouseValue');
        }
        this.getList();
      }
    },
    warehouseValue(newVal) {
      // 当父组件传递的仓库值变化时，更新定数监测产品列表
      console.log('warehouseValue watch - newVal:', newVal, '类型:', typeof newVal);
      if (newVal) {
        this.loadFixedNumberMaterials(newVal);
        this.getList();
      } else {
        this.fixedNumberMaterialIds = [];
        this.getList();
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
        console.log('loadFixedNumberMaterials - warehouseId为空');
        return;
      }
      
      // 确保warehouseId是字符串或数字
      const warehouseIdStr = String(warehouseId);
      console.log('loadFixedNumberMaterials - warehouseId:', warehouseId, '转换为字符串:', warehouseIdStr);
      
      try {
        // 尝试多种可能的storageKey格式
        const possibleKeys = [
          `fixedNumber_1_${warehouseIdStr}`,
          `fixedNumber_1_${Number(warehouseIdStr)}`,
          `fixedNumber_1_${warehouseId}`,
        ];
        
        let savedData = null;
        let usedKey = null;
        
        for (const key of possibleKeys) {
          savedData = localStorage.getItem(key);
          if (savedData) {
            usedKey = key;
            console.log('找到定数监测数据，使用的key:', key);
            break;
          }
        }
        
        // 如果没找到，列出所有相关的localStorage keys并尝试匹配
        if (!savedData) {
          console.log('未找到定数监测数据，尝试的keys:', possibleKeys);
          console.log('localStorage中所有fixedNumber相关的keys:');
          const allFixedNumberKeys = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('fixedNumber_')) {
              allFixedNumberKeys.push(key);
              console.log('  -', key);
              
              // 尝试解析key，看看仓库ID是什么格式
              const match = key.match(/^fixedNumber_1_(.+)$/);
              if (match) {
                const keyWarehouseId = match[1];
                console.log(`    key中的仓库ID: "${keyWarehouseId}" (类型: ${typeof keyWarehouseId}), 当前warehouseId: "${warehouseIdStr}" (类型: ${typeof warehouseIdStr})`);
                
                // 尝试比较（支持字符串和数字比较）
                if (keyWarehouseId == warehouseIdStr || String(keyWarehouseId) === String(warehouseIdStr)) {
                  console.log('    匹配成功！使用这个key');
                  savedData = localStorage.getItem(key);
                  usedKey = key;
                  break;
                }
              }
            }
          }
          
          // 如果还是没找到，尝试所有仓库定数监测的keys
          if (!savedData && allFixedNumberKeys.length > 0) {
            console.log('尝试加载所有仓库定数监测数据...');
            for (const key of allFixedNumberKeys) {
              if (key.startsWith('fixedNumber_1_')) {
                const testData = localStorage.getItem(key);
                if (testData) {
                  try {
                    const testList = JSON.parse(testData);
                    console.log(`key "${key}" 中有 ${testList.length} 条数据`);
                  } catch (e) {
                    console.error(`解析key "${key}" 失败:`, e);
                  }
                }
              }
            }
          }
        }
        
        if (savedData) {
          const fixedNumberList = JSON.parse(savedData);
          console.log('定数监测数据:', fixedNumberList);
          console.log('定数监测数据数量:', fixedNumberList.length);
          console.log('第一条数据示例:', fixedNumberList[0]);
          
          // 提取所有做了定数监测的产品ID，支持多种数据格式
          const materialIds = [];
          
          fixedNumberList.forEach((item, index) => {
            let materialId = null;
            let source = '';
            
            console.log(`\n处理第${index + 1}条定数监测数据:`, item);
            
            // 情况1: item.material.id (嵌套对象) - 这是最常见的情况
            if (item.material) {
              console.log(`  第${index + 1}条 - item.material存在:`, item.material);
              if (item.material.id !== undefined && item.material.id !== null) {
                materialId = item.material.id;
                source = 'item.material.id';
                console.log(`  第${index + 1}条 - 使用item.material.id:`, materialId);
              } else {
                console.warn(`  第${index + 1}条 - item.material存在但没有id:`, item.material);
              }
            }
            // 情况2: item.materialId (直接属性)
            if (!materialId && item.materialId !== undefined && item.materialId !== null) {
              materialId = item.materialId;
              source = 'item.materialId';
              console.log(`  第${index + 1}条 - 使用item.materialId:`, materialId);
            }
            // 情况3: item本身就是material对象，有id属性
            if (!materialId && item.id !== undefined && item.id !== null && (item.code || item.name || item.materialCode || item.materialName)) {
              materialId = item.id;
              source = 'item.id';
              console.log(`  第${index + 1}条 - 使用item.id:`, materialId);
            }
            
            if (materialId !== null && materialId !== undefined) {
              // 转换为字符串，但保留原始值用于比较
              const idStr = String(materialId);
              const idNum = Number(materialId);
              
              // 同时保存字符串和数字格式，确保匹配
              if (idStr && idStr !== 'undefined' && idStr !== 'null' && idStr !== 'NaN') {
                materialIds.push(idStr);
                // 如果是数字，也添加数字格式的字符串（去除前导零等）
                if (!isNaN(idNum) && String(idNum) !== idStr) {
                  materialIds.push(String(idNum));
                }
                console.log(`  ✓ 第${index + 1}条数据，来源: ${source}, ID: ${materialId} (字符串: "${idStr}", 数字: ${idNum})`);
              } else {
                console.warn(`  ✗ 第${index + 1}条数据，ID无效:`, materialId, '字符串:', idStr);
              }
            } else {
              console.warn(`  ✗ 第${index + 1}条数据无法提取ID`);
              console.warn(`    完整数据:`, JSON.stringify(item, null, 2));
              console.warn(`    item.material:`, item.material);
              console.warn(`    item.materialId:`, item.materialId);
              console.warn(`    item.id:`, item.id);
            }
          });
          
          // 去重
          this.fixedNumberMaterialIds = [...new Set(materialIds)];
          
          console.log('=== 提取结果汇总 ===');
          console.log('提取的定数监测产品ID列表:', this.fixedNumberMaterialIds);
          console.log('提取的ID数量:', this.fixedNumberMaterialIds.length);
          console.log('原始数据数量:', fixedNumberList.length);
        } else {
          this.fixedNumberMaterialIds = [];
          console.log('未找到定数监测数据');
        }
      } catch (error) {
        console.error('加载定数监测数据失败:', error);
        this.fixedNumberMaterialIds = [];
      }
    },
    /** 查询耗材信息列表 */
    getList() {
      this.loading = true;
      this.queryParams.isGz = '2';
      
      // 如果有仓库ID且定数监测产品ID列表不为空，使用listMaterialAll获取所有数据
      if (this.warehouseValue && this.fixedNumberMaterialIds.length > 0) {
        // 使用listMaterialAll获取所有数据，确保能获取到所有做了定数监测的产品
        const queryParams = { ...this.queryParams };
        delete queryParams.pageNum;
        delete queryParams.pageSize;
        console.log('使用listMaterialAll查询所有耗材数据，查询参数:', queryParams);
        console.log('定数监测产品ID列表:', this.fixedNumberMaterialIds);
        
        listMaterialAll(queryParams).then(response => {
          let materialList = Array.isArray(response) ? response : [];
          this.processMaterialList(materialList);
        }).catch(error => {
          console.error('查询耗材列表失败:', error);
          this.loading = false;
        });
        return;
      }
      
      // 正常分页查询
      listMaterial(this.queryParams).then(response => {
        let materialList = response.rows || [];
        this.processMaterialList(materialList);
      }).catch(error => {
        console.error('查询耗材列表失败:', error);
        this.loading = false;
      });
    },
    /** 处理耗材列表数据 */
    processMaterialList(materialList) {
        
      console.log('=== 开始过滤耗材列表 ===');
      console.log('查询到的耗材列表数量:', materialList.length);
      console.log('仓库ID:', this.warehouseValue);
      console.log('定数监测产品ID列表:', this.fixedNumberMaterialIds);
      console.log('定数监测产品ID数量:', this.fixedNumberMaterialIds.length);
      
      // 检查是否包含所有定数监测的产品ID
      if (this.fixedNumberMaterialIds.length > 0) {
        const materialIdsInList = materialList.map(item => String(item.id));
        const missingIds = this.fixedNumberMaterialIds.filter(id => {
          const idStr = String(id);
          const idNum = Number(id);
          return !materialIdsInList.includes(idStr) && 
                 !materialIdsInList.includes(String(idNum)) &&
                 !materialIdsInList.some(mid => Number(mid) === idNum);
        });
        if (missingIds.length > 0) {
          console.warn('以下定数监测产品ID在耗材列表中未找到:', missingIds);
          console.warn('这些产品可能不存在于耗材列表中，或者ID格式不匹配');
        } else {
          console.log('✓ 所有定数监测产品ID都在耗材列表中找到了');
        }
      }
        
        // 如果有仓库ID且定数监测产品ID列表不为空，只显示做了定数监测的产品
        if (this.warehouseValue && this.fixedNumberMaterialIds.length > 0) {
          const beforeFilter = materialList.length;
          const matchedItems = [];
          
          // 去重定数监测ID列表（可能包含重复的字符串和数字格式）
          const uniqueFixedNumberIds = [...new Set(this.fixedNumberMaterialIds)];
          console.log('去重后的定数监测ID列表:', uniqueFixedNumberIds);
          console.log('去重后的定数监测ID数量:', uniqueFixedNumberIds.length);
          
          // 创建一个Map来存储所有可能的ID格式，用于快速匹配
          const idMap = new Map();
          uniqueFixedNumberIds.forEach(id => {
            const idStr = String(id);
            const idNum = Number(id);
            // 存储原始字符串
            idMap.set(idStr, true);
            // 如果可以转换为数字，也存储数字格式
            if (!isNaN(idNum) && idNum !== 0) {
              idMap.set(String(idNum), true);
              idMap.set(idNum, true);
            }
          });
          
          console.log('ID匹配Map的所有keys:', Array.from(idMap.keys()));
          
          materialList = materialList.filter(item => {
            if (!item.id && item.id !== 0) {
              console.log('耗材没有ID:', item);
              return false;
            }
            
            // 尝试多种格式匹配
            const itemIdStr = String(item.id);
            const itemIdNum = Number(item.id);
            
            // 检查是否在ID Map中（支持字符串和数字格式）
            const isIncluded = idMap.has(itemIdStr) || 
                              idMap.has(itemIdNum) ||
                              (!isNaN(itemIdNum) && idMap.has(String(itemIdNum)));
            
            if (isIncluded) {
              matchedItems.push({ name: item.name || item.code, id: item.id, idStr: itemIdStr });
              console.log('✓ 匹配到定数监测产品:', item.name || item.code, 'ID:', item.id, 'ID字符串:', itemIdStr, 'ID数字:', itemIdNum);
            } else {
              // 调试：显示未匹配的产品信息（只显示前20条）
              if (matchedItems.length < 20) {
                console.log('✗ 未匹配:', item.name || item.code, 'ID:', item.id, 'ID字符串:', itemIdStr, 'ID数字:', itemIdNum);
                // 检查是否有相似的ID（用于调试）
                const similarIds = uniqueFixedNumberIds.filter(fixedId => {
                  const fixedIdNum = Number(fixedId);
                  return !isNaN(fixedIdNum) && !isNaN(itemIdNum) && Math.abs(fixedIdNum - itemIdNum) < 1;
                });
                if (similarIds.length > 0) {
                  console.log('  发现相似的ID:', similarIds);
                }
              }
            }
            return isIncluded;
          });
          
          console.log('=== 过滤结果 ===');
          console.log('过滤前数量:', beforeFilter);
          console.log('过滤后数量:', materialList.length);
          console.log('匹配到的产品:', matchedItems);
        } else if (this.warehouseValue && this.fixedNumberMaterialIds.length === 0) {
          // 如果仓库有值但没有定数监测产品，显示空列表
          materialList = [];
          console.log('仓库有值但没有定数监测产品，显示空列表');
        } else if (!this.warehouseValue) {
          console.log('没有仓库ID，显示所有耗材');
        }
        
      // 保存所有过滤后的数据
      this.allFilteredMaterials = materialList;
      this.total = materialList.length; // 使用过滤后的数量
      
      // 客户端分页
      const start = (this.queryParams.pageNum - 1) * this.queryParams.pageSize;
      const end = start + this.queryParams.pageSize;
      this.materialList = materialList.slice(start, end);
      
      console.log('最终显示的耗材数量:', this.materialList.length, '总数量:', this.total);
      this.loading = false;
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
      // 如果有过滤后的数据，进行客户端分页
      if (this.allFilteredMaterials && this.allFilteredMaterials.length > 0) {
        const start = (this.queryParams.pageNum - 1) * this.queryParams.pageSize;
        const end = start + this.queryParams.pageSize;
        this.materialList = this.allFilteredMaterials.slice(start, end);
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
