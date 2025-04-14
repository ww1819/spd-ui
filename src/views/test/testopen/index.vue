<template>
    <div class="consumable-management">
      <!-- 顶部工具栏 -->
      <div class="toolbar">
        <div class="date-range">
          <span>日期：</span>
          <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期"></el-date-picker>
        </div>
        <div class="search-box">
          <el-select v-model="searchForm.platform" placeholder="请选择检验平台">
            <el-option label="请选择" value=""></el-option>
          </el-select>
          <el-select v-model="searchForm.instrument" placeholder="请选择仪器">
            <el-option label="请选择" value=""></el-option>
          </el-select>
          <el-button type="primary" icon="el-icon-search" @click="handleSearch">查询</el-button>
        </div>
        <div class="tools">
          <el-button type="primary" icon="el-icon-plus">加载</el-button>
          <el-button type="primary" icon="el-icon-setting">设置</el-button>
          <el-button type="primary" icon="el-icon-edit">编辑</el-button>
          <el-button type="primary" icon="el-icon-more">其他</el-button>
        </div>
      </div>
  
      <!-- 主内容区域 -->
      <div class="content">
        <!-- 左侧表格 -->
        <div class="left-table">
          <div class="load-box">
          <span>加载：</span>
          <el-input v-model="loadInput" placeholder="请扫描包装条码..."></el-input>
          <el-checkbox v-model="printBarcode">打印子条码</el-checkbox>
          <el-button type="primary">加载</el-button>
        </div>
          <el-table :data="leftTableData" border style="width: 100%">
            <el-table-column type="selection" width="55" v-model="selectAllLeft"></el-table-column>
            <el-table-column type="index" label="序" width="50"></el-table-column>
            <el-table-column prop="name" label="耗材名称"></el-table-column>
            <el-table-column prop="code" label="条码号"></el-table-column>
          </el-table>
        </div>
  
        <!-- 中间表格 -->
        <div class="middle-table">
          <div class="open-box">
          <span>开瓶：</span>
          <el-input v-model="openInput" placeholder="请扫描开瓶条码..."></el-input>
          <el-checkbox v-model="openImmediately">打开即用完</el-checkbox>
          <el-button type="primary">开瓶</el-button>
          <el-button type="primary">打印</el-button>
        </div>
          <el-table :data="middleTableData" border style="width: 100%">
            <el-table-column type="selection" width="55" v-model="selectAllMiddle"></el-table-column>
            <el-table-column type="index" label="序" width="50"></el-table-column>
            <el-table-column prop="code" label="子条码号"></el-table-column>
            <el-table-column prop="name" label="耗材名称"></el-table-column>
          </el-table>
        </div>
  
        <!-- 右侧表格 -->
        <div class="right-table">
          <div class="tabs">
            <el-button 
              :type="primary"
              style="margin-right: 10px">
              使用
            </el-button>
            <el-button 
              :type="primary" >
              使用明细
            </el-button>
          </div>
          <el-table :data="rightTableData" border style="width: 100%">
            <el-table-column type="selection" width="55" v-model="selectAllRight"></el-table-column>
            <el-table-column type="index" label="序" width="50"></el-table-column>
            <el-table-column prop="status" label="状态">
              <template #default="scope">
                <el-tag v-if="scope.row.status === '已用完'" type="success">已用完</el-tag>
                <el-tag v-else type="info">未使用</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="code" label="子条码号"></el-table-column>
            <el-table-column prop="person" label="开瓶人"></el-table-column>
            <el-table-column prop="date" label="开瓶日期"></el-table-column>
            <el-table-column prop="days" label="有效天数"></el-table-column>
            <el-table-column prop="times" label="使用次数"></el-table-column>
          </el-table>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        dateRange: [],
        searchForm: {
          platform: '',
          instrument: ''
        },
        selectAllLeft: false,
        selectAllMiddle: false,
        selectAllRight: false,
        leftTableData: [
          { name: '镁测定试剂盒（二甲苯胺蓝法）', code: '20000238', selected: false },
          { name: '载脂蛋白B测定试剂盒（免疫比浊法）', code: '20000374', selected: false },
          { name: '丙型肝炎病毒IgG抗体检测试剂盒（化学发光法）', code: '20000371', selected: false },
          { name: 'B型钠尿肽检测试剂盒（化学发光法）', code: '20000367', selected: false },
          { name: 'B型钠尿肽检测试剂盒（化学发光法）', code: '20000367', selected: false },
          { name: 'B型钠尿肽检测试剂盒（化学发光法）', code: '20000367', selected: false },
          { name: 'B型钠尿肽检测试剂盒（化学发光法）', code: '20000367', selected: false },
          { name: 'B型钠尿肽检测试剂盒（化学发光法）', code: '20000367', selected: false },
          { name: '高敏肌钙蛋白I测定试剂盒（化学发光法）', code: '20000386', selected: false },
          { name: '肌酐测定试剂盒（苦味酸法）', code: '20000255', selected: false },
          { name: '急性时相反应特定蛋白测定比浊试剂盒', code: '20000370', selected: false },
          { name: '急性时相反应特定蛋白测定比浊试剂盒', code: '20000370', selected: false },
          { name: '急性时相反应特定蛋白测定比浊试剂盒', code: '20000370', selected: false },
          { name: '急性时相反应特定蛋白测定比浊试剂盒', code: '20000370', selected: false },
          { name: '急性时相反应特定蛋白测定比浊试剂盒', code: '20000370', selected: false },
          { name: '急性时相反应特定蛋白测定比浊试剂盒', code: '20000370', selected: false }
        ],
        middleTableData: [
          { name: '镁测定试剂盒（二甲苯胺蓝法）', code: '200002386004', selected: false },
          { name: '镁测定试剂盒（二甲苯胺蓝法）', code: '200002386002', selected: false },
          { name: '镁测定试剂盒（二甲苯胺蓝法）', code: '200002386001', selected: false }
        ],
        rightTableData: [
          { status: '已用完', code: '200002386003', person: '陈涛', date: '2025-04-08 16:53:31', days: 30, times: 1, selected: false }
        ],
        loadInput: '',
        printBarcode: true,
        openInput: '',
        openImmediately: true,
      };
    },
    methods: {
      handleSearch() {
        console.log('查询条件:', this.searchForm);
        // 这里可以添加查询逻辑
      }
    }
  };
  </script>
  
  <style scoped>
  .consumable-management {
    padding: 20px;
    font-family: 'Arial', sans-serif;
  }
  
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 10px;
    background-color: #f5f7fa;
    border-radius: 5px;
  }
  
  .date-range {
    display: flex;
    align-items: center;
  }
  
  .search-box {
    display: flex;
    align-items: center;
  }
  
  .tools {
    display: flex;
    gap: 10px;
  }
  
  .content {
    display: flex;
    gap: 15px;
    margin-bottom: 20px;
  }
  
  .left-table, .middle-table, .right-table {
    flex: 1;
    background-color: #fff;
    border-radius: 5px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }
  
  .table-header {
    display: flex;
    align-items: center;
    padding: 10px;
    border-bottom: 1px solid #e4e7ed;
  }
  
  .table-body {
    max-height: 400px;
    overflow-y: auto;
  }
  
  .table-row {
    display: flex;
    align-items: center;
    padding: 10px;
    border-bottom: 1px solid #e4e7ed;
  }
  
  .table-cell {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .bottom-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    background-color: #f5f7fa;
    border-radius: 5px;
  }
  
  .load-box, .open-box {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .tabs {
    flex: 1;
  }
  </style>