<template>
  <div class="app-container">
    <div class="query-container">
      <div class="form-fields-container">
        <el-form :model="searchForm" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">
          <el-row class="query-row-left">
            <el-col :span="24">
              <el-form-item label="科室" prop="departmentId" class="query-item-inline">
                <div class="query-select-wrapper">
                  <SelectDepartment v-model="searchForm.departmentId" />
                </div>
              </el-form-item>
              <el-form-item label="耗材" prop="materialId" class="query-item-inline">
                <div class="query-select-wrapper">
                  <SelectMaterial v-model="searchForm.materialId" />
                </div>
              </el-form-item>
              <el-form-item label="耗材名称" prop="materialName" class="query-item-inline">
                <el-input v-model="searchForm.materialName" placeholder="请输入耗材名称" clearable style="width: 180px" />
              </el-form-item>
              <el-form-item label="规格" prop="specification" class="query-item-inline">
                <el-input v-model="searchForm.specification" placeholder="请输入规格" clearable style="width: 180px" />
              </el-form-item>
              <el-form-item label="型号" prop="model" class="query-item-inline">
                <el-input v-model="searchForm.model" placeholder="请输入型号" clearable style="width: 180px" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row class="query-row-left">
            <el-col :span="24" style="white-space: nowrap; overflow-x: auto;">
              <el-form-item label="HIS收费编码" prop="hisChargeCode" class="query-item-inline">
                <el-input v-model="searchForm.hisChargeCode" placeholder="请输入HIS收费编码" clearable style="width: 180px" />
              </el-form-item>
              <el-form-item label="患者住院号/门诊号" prop="patientId" class="query-item-inline">
                <el-input v-model="searchForm.patientId" placeholder="请输入患者住院号/门诊号" clearable style="width: 180px" />
              </el-form-item>
              <el-form-item label="日期范围" prop="dateRange" class="query-item-inline">
                <el-date-picker
                  v-model="searchForm.dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  value-format="yyyy-MM-dd"
                  clearable
                  style="width: 240px"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
    </div>

    <el-row :gutter="10" class="mb8" style="padding-top: 0px; margin-top: 0px; margin-bottom: 16px;">
      <el-col :span="1.5">
        <el-button
          type="primary"
          icon="el-icon-search"
          size="small"
          @click="handleSearch"
        >搜索</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          icon="el-icon-refresh"
          size="small"
          @click="resetSearch"
        >重置</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="handleSearch"></right-toolbar>
    </el-row>

    <div class="table-container">
      <el-table
        :data="tableData"
        v-loading="loading"
        height="450"
        border
        show-summary
        :summary-method="getSummaries"
      >
        <el-table-column type="index" label="序号" align="center" width="80" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
          </template>
        </el-table-column>
        <el-table-column label="单号" align="center" prop="billNo" width="180" show-overflow-tooltip resizable />
        <el-table-column label="科室" align="center" prop="departmentName" width="120" show-overflow-tooltip resizable />
        <el-table-column label="名称" align="center" prop="materialName" width="150" show-overflow-tooltip resizable />
        <el-table-column label="规格" align="center" prop="specification" width="120" show-overflow-tooltip resizable />
        <el-table-column label="型号" align="center" prop="model" width="120" show-overflow-tooltip resizable />
        <el-table-column label="单价" align="center" prop="unitPrice" width="100" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.unitPrice">{{ formatCurrency(scope.row.unitPrice) }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="数量" align="center" prop="quantity" width="100" show-overflow-tooltip resizable />
        <el-table-column label="金额" align="center" prop="amount" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.amount">{{ formatCurrency(scope.row.amount) }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="耗材分类" align="center" prop="category" width="120" show-overflow-tooltip resizable />
        <el-table-column label="财务分类" align="center" prop="financialCategory" width="120" show-overflow-tooltip resizable />
        <el-table-column label="注册证号" align="center" prop="registrationNumber" width="180" show-overflow-tooltip resizable />
        <el-table-column label="医保编码" align="center" prop="medicalInsuranceCode" width="120" show-overflow-tooltip resizable />
        <el-table-column label="HIS收费项目编码" align="center" prop="hisChargeItemCode" width="150" show-overflow-tooltip resizable />
      </el-table>
    </div>

    <pagination
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="handleSearch"
    />
  </div>
</template>

<script>
import SelectDepartment from '@/components/SelectModel/SelectDepartment';
import SelectMaterial from '@/components/SelectModel/SelectMaterial';
import SelectSupplier from '@/components/SelectModel/SelectSupplier';
import request from '@/utils/request';
import RightToolbar from '@/components/RightToolbar';
import Pagination from '@/components/Pagination';

export default {
  name: 'DetailReport',
  components: {SelectMaterial, SelectDepartment, SelectSupplier, RightToolbar, Pagination},
  data() {
    return {
      // 遮罩层
      loading: false,
      // 显示搜索条件
      showSearch: true,
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
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10
      },
      // 表格数据
      tableData: [],
      // 总条数
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
      this.queryParams.pageNum = 1
      this.getDepartmentConsumptionData()
    },
    
    // 重置查询条件
    resetSearch() {
      this.resetForm("queryForm")
      this.queryParams.pageNum = 1
      this.handleSearch()
    },
    
    // 处理排序变化
    handleSortChange({ prop, order }) {
      this.sortProp = prop
      this.sortOrder = order
      this.getDepartmentConsumptionData()
    },
    
    // 序号生成
    tableDataIndex({ row, rowIndex }) {
      const pageNum = Math.max(1, parseInt(this.queryParams.pageNum, 10));
      const pageSize = Math.max(1, parseInt(this.queryParams.pageSize, 10));
      row.index = (pageNum - 1) * pageSize + rowIndex + 1;
    },
    
    // 获取科室消耗数据
    getDepartmentConsumptionData() {
      this.loading = true
      // 构建查询参数
      const params = {
        departmentId: this.searchForm.departmentId,
        materialId: this.searchForm.materialId,
        materialName: this.searchForm.materialName,
        specification: this.searchForm.specification,
        model: this.searchForm.model,
        hisChargeCode: this.searchForm.hisChargeCode,
        patientId: this.searchForm.patientId,
        pageNum: this.queryParams.pageNum,
        pageSize: this.queryParams.pageSize
      }
      
      // 处理日期范围
      if (this.searchForm.dateRange && this.searchForm.dateRange.length === 2) {
        params.beginDate = this.searchForm.dateRange[0]
        params.endDate = this.searchForm.dateRange[1]
      }
      
      // 调用后端接口
      request({
        url: '/department/batchConsume/auditedDetailList',
        method: 'get',
        params: params
      }).then(response => {
        console.log('接口返回数据:', response)
        // 处理响应数据，兼容不同的响应格式
        if (response) {
          if (response.code === 200 || response.code === undefined) {
            // 如果 response 直接包含 rows 和 total，说明已经是处理后的数据
            this.tableData = response.rows || response.data?.rows || []
            this.total = response.total || response.data?.total || 0
            console.log('表格数据:', this.tableData, '总数:', this.total)
          } else {
            this.tableData = []
            this.total = 0
            if (response.msg) {
              this.$modal.msgWarning(response.msg)
            }
          }
        } else {
          this.tableData = []
          this.total = 0
        }
        this.loading = false
      }).catch(error => {
        console.error('查询失败:', error)
        this.$modal.msgError('查询失败：' + (error.msg || error.message || '未知错误'))
        this.tableData = []
        this.total = 0
        this.loading = false
      })
    },
    
    // 模拟科室消耗数据（已废弃，保留用于参考）
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
      for (let i = 0; i < this.queryParams.pageSize; i++) {
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
      const sums = Array(columns.length).fill('');
      
      // 第一列显示"合计"
      sums[0] = '合计';
      
      // 计算合计数量和金额
      let totalQty = 0;
      let totalAmt = 0;
      
      // 计算总和
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        totalQty += Number(item.quantity || 0);
        totalAmt += Number(item.amount || 0);
      }
      
      // 遍历所有列，为指定列设置合计值
      columns.forEach((column, index) => {
        if (column.property === 'quantity') {
          sums[index] = totalQty.toFixed(2);
        } else if (column.property === 'amount') {
          sums[index] = '￥' + totalAmt.toFixed(2);
        }
      });
      
      return sums;
    }
  }
}
</script>

<style scoped>
/* 查询条件样式 */
.query-row-left {
  margin-bottom: 10px;
}

.query-row-left .el-col[style*="white-space: nowrap"] {
  white-space: nowrap !important;
  overflow-x: auto;
}

.query-item-inline {
  display: inline-block;
  margin-right: 16px;
  margin-bottom: 10px;
}

.query-item-inline .el-form-item__label {
  width: 80px !important;
}

.query-select-wrapper {
  width: 180px;
}

/* 查询容器样式 */
.query-container {
  margin-top: -20px;
  margin-bottom: 16px;
}

/* 查询条件容器框样式 */
.form-fields-container {
  background: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid #EBEEF5;
}

.table-container {
  margin-top: 0px;
  width: 100%;
  position: relative;
  min-height: 450px;
}

/* 加粗表格底部滚动条，提升可操作性 */
.table-container ::-webkit-scrollbar {
  height: 12px;
}

.table-container ::-webkit-scrollbar-thumb {
  height: 12px;
  border-radius: 6px;
}
</style>