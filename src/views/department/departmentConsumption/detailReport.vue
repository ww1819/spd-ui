<template>
  <div class="department-consumption-container">
    <div class="title-section">
      <h3>科室消耗追溯明细报表</h3>
    </div>
    
    <!-- 查询条件区域 -->
    <div class="search-section">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="科室" prop="materialId" label-width="100px">
          <SelectDepartment v-model="searchForm.departmentId" />
        </el-form-item>

        <el-form-item label="耗材" prop="materialId" label-width="100px">
          <SelectMaterial v-model="searchForm.materialId" />
        </el-form-item>
        <el-form-item label="耗材名称">
          <el-input v-model="searchForm.materialName" placeholder="请输入耗材名称" clearable />
        </el-form-item>
        <el-form-item label="规格">
          <el-input v-model="searchForm.specification" placeholder="请输入规格" clearable />
        </el-form-item>
        <el-form-item label="型号">
          <el-input v-model="searchForm.model" placeholder="请输入型号" clearable />
        </el-form-item>
        <el-form-item label="HIS收费编码">
          <el-input v-model="searchForm.hisChargeCode" placeholder="请输入HIS收费编码" clearable />
        </el-form-item>
        <el-form-item label="患者住院号/门诊号">
          <el-input v-model="searchForm.patientId" placeholder="请输入患者住院号/门诊号" clearable />
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="yyyy-MM-dd"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <!-- 数据表格区域 -->
    <div class="table-section">
      <el-table
        :data="tableData"
        style="width: 100%"
        stripe
        border
        @sort-change="handleSortChange"
        show-summary
        :summary-method="getSummaries"
      >
        <el-table-column type="index" label="序号" width="80" />
        <el-table-column prop="departmentName" label="科室" min-width="120" sortable />
        <el-table-column prop="materialName" label="名称" min-width="150" sortable />
        <el-table-column prop="specification" label="规格" min-width="120" />
        <el-table-column prop="model" label="型号" min-width="120" />
        <el-table-column prop="unitPrice" label="单价" min-width="100" sortable>
          <template slot-scope="scope">
            {{ formatCurrency(scope.row.unitPrice) }}
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" min-width="100" sortable />
        <el-table-column prop="amount" label="金额" min-width="100" sortable>
          <template slot-scope="scope">
            {{ formatCurrency(scope.row.amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="category" label="耗材分类" min-width="120" />
        <el-table-column prop="financialCategory" label="财务分类" min-width="120" />
        <el-table-column prop="registrationNumber" label="注册证号" min-width="180" />
        <el-table-column prop="medicalInsuranceCode" label="医保编码" min-width="120" />
        <el-table-column prop="hisChargeItemCode" label="HIS收费项目编码" min-width="150" />
        <el-table-column prop="consumptionDate" label="消耗日期" min-width="120" sortable />
        <el-table-column prop="batchNumber" label="批次号" min-width="150" />
        <el-table-column prop="supplier" label="供应商" min-width="150" />
      </el-table>
      
      <!-- 分页组件 -->
      <div class="pagination-section">
        <el-pagination
          v-model="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script>
import SelectDepartment from '@/components/SelectModel/SelectDepartment';
import SelectMaterial from '@/components/SelectModel/SelectMaterial';
import SelectSupplier from '@/components/SelectModel/SelectSupplier';
export default {
  name: 'DetailReport',
  components: {SelectMaterial,SelectDepartment,SelectSupplier},
  data() {
    return {
      // 查询表单
      searchForm: {
        departmentId: '',
        materialId: '',
        materialName: '',
        specification: '',
        model: '',
        hisChargeCode: '',
        patientId: '',
        dateRange: []
      },
      // 表格数据
      tableData: [],
      // 分页信息
      currentPage: 1,
      pageSize: 20,
      total: 0,
      // 排序信息
      sortProp: '',
      sortOrder: ''
    }
  },
  created() {
    // 组件创建时获取初始数据
    this.getDepartmentConsumptionData()
  },
  methods: {
    // 格式化金额
    formatCurrency(value) {
      if (!value && value !== 0) return '0.00'
      return Number(value).toFixed(2)
    },
    
    // 查询数据
    handleSearch() {
      this.currentPage = 1
      this.getDepartmentConsumptionData()
    },
    
    // 重置查询条件
    resetSearch() {
        this.searchForm = {
          departmentName: '',
          materialName: '',
          specification: '',
          model: '',
          hisChargeCode: '',
          patientId: '',
          dateRange: []
        }
        this.currentPage = 1
        this.getDepartmentConsumptionData()
      },
    
    // 处理排序变化
    handleSortChange({ prop, order }) {
      this.sortProp = prop
      this.sortOrder = order
      this.getDepartmentConsumptionData()
    },
    
    // 处理页面大小变化
    handleSizeChange(size) {
      this.pageSize = size
      this.getDepartmentConsumptionData()
    },
    
    // 处理当前页码变化
    handleCurrentChange(current) {
      this.currentPage = current
      this.getDepartmentConsumptionData()
    },
    
    // 获取科室消耗数据
    getDepartmentConsumptionData() {
      // 构建查询参数
      const params = {
        ...this.searchForm,
        page: this.currentPage,
        pageSize: this.pageSize
      }
      
      // 添加排序参数
      if (this.sortProp && this.sortOrder) {
        params.sortField = this.sortProp
        params.sortOrder = this.sortOrder === 'ascending' ? 'asc' : 'desc'
      }
      
      // 模拟API调用（实际项目中替换为真实API调用）
      // this.$axios.get('/api/department/consumption', { params })
      //   .then(res => {
      //     this.tableData = res.data.list
      //     this.total = res.data.total
      //   })
      
      // 模拟数据
      this.mockDepartmentConsumptionData()
    },
    
    // 模拟科室消耗数据
    mockDepartmentConsumptionData() {
      // 生成模拟数据
      const mockData = []
      const departments = ['内科', '外科', '妇产科', '儿科', '眼科', '口腔科', '耳鼻喉科', '皮肤科']
      const materials = [
        { name: '一次性使用无菌注射器', spec: '2ml', model: 'SYR-2', regNum: '国械注准20153150001', category: '注射穿刺器械', financialCategory: '低值耗材', medicalInsuranceCode: '20100001', hisChargeItemCode: 'H001' },
        { name: '医用外科口罩', spec: '成人型', model: 'MKZ-1', regNum: '国械注准20183140002', category: '医用卫生材料及敷料', financialCategory: '低值耗材', medicalInsuranceCode: '20200001', hisChargeItemCode: 'H002' },
        { name: '一次性使用手术衣', spec: 'XL', model: 'SY-1', regNum: '国械注准20193140003', category: '医用卫生材料及敷料', financialCategory: '低值耗材', medicalInsuranceCode: '20300001', hisChargeItemCode: 'H003' },
        { name: '医用橡胶手套', spec: '无粉', model: 'G-1', regNum: '国械注准20173140004', category: '医用卫生材料及敷料', financialCategory: '低值耗材', medicalInsuranceCode: '20400001', hisChargeItemCode: 'H004' },
        { name: '一次性使用输液器', spec: '0.55mm', model: 'SYQ-1', regNum: '国械注准20163150005', category: '注射穿刺器械', financialCategory: '低值耗材', medicalInsuranceCode: '20500001', hisChargeItemCode: 'H005' }
      ]
      const suppliers = ['医疗器械有限公司A', '医疗科技股份有限公司B', '医疗器械集团C']
      
      // 生成当前页数据
      for (let i = 0; i < this.pageSize; i++) {
        const material = materials[Math.floor(Math.random() * materials.length)]
        const unitPrice = Math.random() * 100 + 10
        const quantity = Math.floor(Math.random() * 100) + 1
        const amount = unitPrice * quantity
        const batchNumber = `BATCH${2024}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
        
        // 随机日期（近一年）
        const now = new Date()
        const randomDate = new Date(now.getTime() - Math.random() * 365 * 24 * 60 * 60 * 1000)
        const formattedDate = randomDate.toISOString().split('T')[0]
        
        mockData.push({
          departmentName: departments[Math.floor(Math.random() * departments.length)],
          materialName: material.name,
          specification: material.spec,
          model: material.model,
          unitPrice: unitPrice,
          quantity: quantity,
          amount: amount,
          registrationNumber: material.regNum,
          consumptionDate: formattedDate,
          batchNumber: batchNumber,
          supplier: suppliers[Math.floor(Math.random() * suppliers.length)],
          category: material.category,
          financialCategory: material.financialCategory,
          medicalInsuranceCode: material.medicalInsuranceCode,
          hisChargeItemCode: material.hisChargeItemCode
        })
      }
      
      // 设置表格数据和总数
      this.tableData = mockData
      this.total = 500 // 模拟总数
    },
    
    // 表格汇总方法
    getSummaries(param) {
      const { columns, data } = param;
      const sums = [];
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = '合计';
          return;
        }
        const values = data.map(item => Number(item[column.property]));
        // 只对数量和金额进行汇总
        if (column.property === 'quantity' || column.property === 'amount') {
          if (!values.every(value => isNaN(value))) {
            sums[index] = values.reduce((prev, curr) => {
              const value = Number(curr);
              return isNaN(value) ? prev : prev + value;
            }, 0);
            if (column.property === 'amount') {
              sums[index] = sums[index].toFixed(2);
            }
          } else {
            sums[index] = '--';
          }
        } else {
          sums[index] = '';
        }
      });
      return sums;
    }
  }
}
</script>

<style scoped>
.department-consumption-container {
  padding: 20px;
  background-color: #ffffff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.title-section {
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e4e7ed;
}

.title-section h3 {
  margin: 0;
  color: #303133;
  font-size: 18px;
  font-weight: 500;
}

.search-section {
  background-color: #ffffff;
  padding: 20px;
  border-radius: 4px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.table-section {
  background-color: #ffffff;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.pagination-section {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .department-consumption-container {
    padding: 10px;
  }
  
  .search-form {
    flex-direction: column;
  }
  
  .search-form .el-form-item {
    width: 100%;
  }
}
</style>