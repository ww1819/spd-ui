<template>
    <div class="procurement-management">
      <!-- 搜索框 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="机构单位：">
          <el-select v-model="searchForm.orgUnit" placeholder="请选择机构单位">
            <el-option label="巴中市中心医院" value="巴中市中心医院"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="仓库：">
          <el-select v-model="searchForm.warehouse" placeholder="请选择仓库">
            <el-option label="南池检验试剂库房" value="南池检验试剂库房"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="供应商：">
          <el-select v-model="searchForm.supplier" placeholder="请选择供应商">
            <el-option label="四川鼎盛亿利医疗设备有限公司" value="四川鼎盛亿利医疗设备有限公司"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="单号：">
          <el-input v-model="searchForm.orderNumber" placeholder="请输入单号"></el-input>
        </el-form-item>
        <el-form-item label="类型：">
          <el-select v-model="searchForm.type" placeholder="请选择类型">
            <el-option label="全部" value="全部"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="批号：">
          <el-input v-model="searchForm.batchNumber" placeholder="请输入批号"></el-input>
        </el-form-item>
        <el-form-item label="发票号：">
          <el-input v-model="searchForm.invoiceNumber" placeholder="请输入发票号"></el-input>
        </el-form-item>
        <el-form-item label="制单人：">
          <el-input v-model="searchForm.creator" placeholder="请输入制单人"></el-input>
        </el-form-item>
        <el-form-item label="日期：">
          <el-date-picker
            v-model="searchForm.date"
            type="date"
            placeholder="选择日期"
            value-format="yyyy-MM-dd"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="止：">
          <el-date-picker
            v-model="searchForm.endDate"
            type="date"
            placeholder="选择结束日期"
            value-format="yyyy-MM-dd"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="复核状态：">
          <el-select v-model="searchForm.reviewStatus" placeholder="请选择复核状态">
            <el-option label="已复核" value="已复核"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="onSearch">搜索</el-button>
        </el-form-item>
      </el-form>
  
      <!-- 功能按钮 -->
      <div class="function-buttons">
        <el-button type="danger" icon="el-icon-plus" @click="onInvoiceSupplement">发票补录</el-button>
        <el-button type="primary" icon="el-icon-check" @click="onReviewEntry">复核入库</el-button>
        <el-button icon="el-icon-upload2" @click="onUploadPlatform">上传供应链平台</el-button>
        <el-button icon="el-icon-download" @click="onExport">导出</el-button>
      </div>
  
      <!-- 表格 -->
      <el-table :data="tableData" border style="width: 100%">
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="orderNumber" label="单号" align="center"></el-table-column>
        <el-table-column prop="warehouse" label="仓库" align="center"></el-table-column>
        <el-table-column prop="supplier" label="供应商" align="center"></el-table-column>
        <el-table-column prop="creator" label="制单人" align="center"></el-table-column>
        <el-table-column prop="createDate" label="制单日期" align="center"></el-table-column>
        <el-table-column prop="invoiceNumber" label="发票号码" align="center"></el-table-column>
        <el-table-column prop="invoiceDate" label="发票日期" align="center"></el-table-column>
        <el-table-column prop="invoiceAmount" label="发票金额" align="center"></el-table-column>
        <el-table-column prop="totalAmount" label="总金额" align="center"></el-table-column>
        <el-table-column prop="reviewer" label="审核人" align="center"></el-table-column>
        <el-table-column prop="reviewDate" label="审核日期" align="center"></el-table-column>
        <el-table-column label="操作" align="center">
          <template #default>
            <el-button type="primary" size="small">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        searchForm: {
          orgUnit: '巴中市中心医院',
          warehouse: '南池检验试剂库房',
          supplier: '四川鼎盛亿利医疗设备有限公司',
          orderNumber: '',
          type: '全部',
          batchNumber: '',
          invoiceNumber: '',
          creator: '',
          date: '2025-03-03',
          endDate: '2025-03-10',
          reviewStatus: '已复核'
        },
        tableData: [
          {
            orderNumber: 'RK-250304-23144',
            warehouse: '南池检验试剂库房',
            supplier: '四川鼎盛亿利医疗设备有限公司',
            creator: '孙琴',
            createDate: '2025-03-04',
            invoiceNumber: '2551200000004679',
            invoiceDate: '2025-03-03',
            invoiceAmount: '12300',
            totalAmount: '12300',
            reviewer: '孙琴',
            reviewDate: '2025-03-04'
          }
        ]
      };
    },
    methods: {
      onSearch() {
        // 搜索功能实现
        console.log('搜索功能触发');
      },
      onInvoiceSupplement() {
        // 发票补录功能实现
        console.log('发票补录功能触发');
      },
      onReviewEntry() {
        // 复核入库功能实现
        console.log('复核入库功能触发');
      },
      onUploadPlatform() {
        // 上传供应链平台功能实现
        console.log('上传供应链平台功能触发');
      },
      onExport() {
        // 导出功能实现
        console.log('导出功能触发');
      }
    }
  };
  </script>
  
  <style scoped>
  .procurement-management {
    padding: 20px;
  }
  
  .search-form {
    margin-bottom: 20px;
  }
  
  .function-buttons {
    margin-bottom: 20px;
    text-align: left;
  }
  </style>