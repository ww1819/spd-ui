<template>
  <div class="app-container">
    <el-row :gutter="20">
      <!-- 左侧68分类树 -->
      <el-col :span="4">
        <el-card class="tree-card">
          <div slot="header" class="tree-header">
            <span>68分类</span>
          </div>
          <el-tree
            :data="treeData"
            :props="treeProps"
            node-key="category68Id"
            highlight-current
            @node-click="handleCategoryNodeClick"
            :indent="20"
            :default-expanded-keys="defaultExpandedKeys"
          >
            <span slot-scope="{ node }" class="custom-tree-node">
              <i class="el-icon-folder-opened" />
              <span>{{ node.label }}</span>
            </span>
          </el-tree>
        </el-card>
      </el-col>

      <!-- 右侧表格区域 -->
      <el-col :span="20">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px" class="search-form">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="档案名称" prop="assetName">
            <el-input
              v-model="queryParams.assetName"
              placeholder="请输入档案名称"
              clearable
              @keyup.enter.native="handleQuery"
              style="width: 150px"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="档案编码" prop="assetCode">
            <el-input
              v-model="queryParams.assetCode"
              placeholder="请输入档案编码"
              clearable
              @keyup.enter.native="handleQuery"
              style="width: 150px"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="使用科室" prop="useDepartment">
            <el-input
              v-model="queryParams.useDepartment"
              placeholder="请输入使用科室"
              clearable
              @keyup.enter.native="handleQuery"
              style="width: 150px"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="资产状态" prop="assetStatus">
            <el-select v-model="queryParams.assetStatus" placeholder="请选择资产状态" clearable style="width: 150px">
              <el-option label="正常使用" value="正常使用"></el-option>
              <el-option label="待维修" value="待维修"></el-option>
              <el-option label="待拆分" value="待拆分"></el-option>
              <el-option label="报废" value="报废"></el-option>
              <el-option label="待报废" value="待报废"></el-option>
              <el-option label="已损坏" value="已损坏"></el-option>
              <el-option label="待报废使用中" value="待报废使用中"></el-option>
              <el-option label="待报废未使用" value="待报废未使用"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="6">
          <div style="display: inline">
            <span>起</span>
            <el-date-picker clearable
                            v-model="queryParams.beginDate"
                            type="date"
                            value-format="yyyy-MM-dd"
                            placeholder="请选择起始日期"
                            style="width: 120px"
            >
            </el-date-picker>
            <span>止</span>
            <el-date-picker clearable
                            v-model="queryParams.endDate"
                            type="date"
                            value-format="yyyy-MM-dd"
                            placeholder="请选择截止日期"
                            style="width: 120px"
            >
            </el-date-picker>
          </div>
        </el-col>
        <el-col :span="6" v-if="switchValue === '仓库'">
          <el-form-item label="仓库" prop="warehouseId">
            <el-select v-model="queryParams.warehouseId" placeholder="请选择仓库" clearable style="width: 150px">
              <el-option
                v-for="item in warehouseOptions"
                :key="item.id"
                :label="item.name"
                :value="item.id">
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="3">
        <el-radio-group v-model="switchValue" @change="handleSwitchChange" size="small" style="display: flex;">
          <el-radio-button label="全部">全部</el-radio-button>
          <el-radio-button label="科室">科室库存</el-radio-button>
          <el-radio-button label="仓库">仓库库存</el-radio-button>
        </el-radio-group>
      </el-col>
      <el-col :span="1.5" :offset="2">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="small"
          @click="handleAdd"
          v-hasPermi="['equipment:info:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="info"
          plain
          icon="el-icon-printer"
          size="small"
          @click="handlePrintList"
          v-hasPermi="['equipment:info:print']"
        >打印</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-edit"
          size="small"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['equipment:info:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="small"
          :disabled="single"
          @click="handleDelete"
          v-hasPermi="['equipment:info:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="small"
          @click="handleExport"
          v-hasPermi="['equipment:info:export']"
        >导出</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          icon="el-icon-search"
          size="small"
          @click="handleQuery"
        >搜索</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="info"
          plain
          icon="el-icon-upload2"
          size="small"
          @click="handleImport"
          v-hasPermi="['equipment:info:import']"
        >导入</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="equipmentList" @selection-change="handleSelectionChange" @row-dblclick="handleView" height="calc(100vh - 40vh)" :cell-style="{padding: '8px 4px'}">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column label="序号" align="center" width="60" show-overflow-tooltip>
        <template slot-scope="scope">
          {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column label="档案编码" align="center" prop="assetCode" width="150" show-overflow-tooltip/>
      <el-table-column label="档案名称" align="center" prop="assetName" width="180" show-overflow-tooltip/>
      <el-table-column label="分类编码" align="center" prop="categoryCode" width="120" show-overflow-tooltip/>
      <el-table-column label="所属分类" align="center" prop="specification" width="120" show-overflow-tooltip/>
      <el-table-column label="型号" align="center" prop="model" width="100" show-overflow-tooltip/>
      <el-table-column label="使用科室" align="center" prop="useDepartment" width="100" show-overflow-tooltip v-if="switchValue !== '仓库'">
        <template slot-scope="scope">
          <span>{{ getDepartmentName(scope.row.useDepartment) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="管理科室" align="center" prop="manageDepartment" width="100" show-overflow-tooltip v-if="switchValue !== '仓库'">
        <template slot-scope="scope">
          <span>{{ getDepartmentName(scope.row.manageDepartment) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="供应商" align="center" prop="supplier" width="140" show-overflow-tooltip/>
      <el-table-column label="仓库" align="center" prop="hospitalCode" width="100" show-overflow-tooltip>
        <template slot-scope="scope">
          <span>{{ getWarehouseName(scope.row.hospitalCode) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="入库单号" align="center" prop="storageNo" width="150" show-overflow-tooltip>
        <template slot-scope="scope">
          <span>{{ scope.row.storageNo || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="资产序列号" align="center" prop="serialNumber" width="150" show-overflow-tooltip/>
      <el-table-column label="价格" align="center" prop="originalPrice" width="100" show-overflow-tooltip/>
      <el-table-column label="存放地点" align="center" prop="storageLocation" width="100" show-overflow-tooltip/>
      <el-table-column label="资产状态" align="center" prop="assetStatus" width="120" show-overflow-tooltip>
        <template slot-scope="scope">
          <el-tag :type="getAssetStatusTagType(scope.row.assetStatus)">
            {{ scope.row.assetStatus || '' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="品牌" align="center" prop="brand" width="80" show-overflow-tooltip/>
      <el-table-column label="创建日期" align="center" prop="createTime" width="100" show-overflow-tooltip>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="100" fixed="right" show-overflow-tooltip>
        <template slot-scope="scope">
          <el-button
            size="small"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['equipment:info:remove']"
          >删除</el-button>
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
      </el-col>
    </el-row>

    <!-- 打印组件（用于列表页面打印） -->
    <asset-card-print v-if="printAssetCardData" :row="printAssetCardData" ref="assetCardPrintRefAuto"></asset-card-print>

    <!-- 添加或修改设备信息局部弹窗 -->
    <div v-if="open" class="local-modal-mask">
      <div class="local-modal-content">
        <div class="modal-header-fixed">
          <div style="font-size:18px;font-weight:bold;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;">
            <span>{{ title }}</span>
            <el-button type="text" @click="cancel" style="font-size:14px;padding:0;color:#909399;">关闭</el-button>
        </div>
        </div>
        <el-tabs v-model="activeTab" class="equipment-tabs">
        <!-- 基本信息 -->
        <el-tab-pane label="基本信息" name="basic">
          <el-form ref="form" :model="form" :rules="rules" label-width="120px">
            <!-- 第一行 -->
            <el-row :gutter="20">
              <el-col :span="4">
                <el-form-item label="档案编码：" prop="assetCode">
                  <el-input
                    v-model="form.assetCode"
                    :disabled="form.id != null"
                    placeholder="请选择所属分类后自动生成"
                    @blur="validateAssetCode"
                    @input="handleAssetCodeInput"
                  ></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="档案名称：" prop="assetName" required>
                  <el-input v-model="form.assetName"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="规格：" prop="specification">
                  <el-input v-model="form.specification"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="型号：" prop="model">
                  <el-input v-model="form.model"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="仓库：" prop="hospitalCode">
                  <el-select
                    v-model="form.hospitalCode"
                    placeholder="请选择仓库"
                    style="width:100%"
                    filterable
                    clearable>
                    <el-option
                      v-for="item in warehouseOptions"
                      :key="item.id"
                      :label="item.name"
                      :value="item.id">
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="价格/元：" prop="originalPrice">
                  <el-input v-model="form.originalPrice"></el-input>
                </el-form-item>
              </el-col>
            </el-row>

            <!-- 第二行 -->
            <el-row :gutter="20">
              <el-col :span="4">
                <el-form-item label="资产序列号：" prop="serialNumber">
                  <el-input v-model="form.serialNumber"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="辅助分类：" prop="auxiliaryCategory">
                  <el-select v-model="form.auxiliaryCategory" style="width:100%">
                    <el-option label="分类1" value="1"></el-option>
                    <el-option label="分类2" value="2"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="资产状态：" prop="assetStatus" required>
                  <el-select v-model="form.assetStatus" placeholder="请选择资产状态" style="width:100%" clearable>
                    <el-option label="正常使用" value="正常使用"></el-option>
                    <el-option label="待维修" value="待维修"></el-option>
                    <el-option label="待拆分" value="待拆分"></el-option>
                    <el-option label="报废" value="报废"></el-option>
                    <el-option label="待报废" value="待报废"></el-option>
                    <el-option label="已损坏" value="已损坏"></el-option>
                    <el-option label="待报废使用中" value="待报废使用中"></el-option>
                    <el-option label="待报废未使用" value="待报废未使用"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="财务分类：" prop="financialCategory" required>
                  <el-select v-model="form.financialCategory" style="width:100%">
                    <el-option label="分类1" value="1"></el-option>
                    <el-option label="分类2" value="2"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="财务编号：" prop="financialCode">
                  <el-input v-model="form.financialCode"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="品牌：" prop="brand">
                  <el-input v-model="form.brand"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="产地：" prop="origin">
                  <el-input v-model="form.origin"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="供应商：" prop="supplier">
                  <el-select
                    v-model="form.supplier"
                    placeholder="请选择供应商"
                    style="width:100%"
                    filterable
                    clearable
                  >
                    <el-option
                      v-for="supplier in supplierOptions"
                      :key="supplier.id"
                      :label="supplier.name"
                      :value="supplier.name"
                    >
                      <span>{{ supplier.name }}</span>
                      <span style="color: #8492a6; font-size: 13px; margin-left: 10px;">{{ supplier.code }}</span>
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="生产厂家：" prop="factoryId">
                  <el-select
                    v-model="form.factoryId"
                    placeholder="请选择生产厂家"
                    style="width:100%"
                    filterable
                    clearable
                  >
                    <el-option
                      v-for="factory in factoryOptions"
                      :key="factory.id"
                      :label="factory.name"
                      :value="factory.name"
                    >
                      <span>{{ factory.name }}</span>
                      <span style="color: #8492a6; font-size: 13px; margin-left: 10px;">{{ factory.code }}</span>
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <!-- 第三行 -->
            <el-row :gutter="20">
              <el-col :span="4">
                <el-form-item label="国别：" prop="country">
                  <el-input v-model="form.country"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="单位：" prop="unit">
                  <el-select
                    v-model="form.unit"
                    placeholder="请选择单位"
                    style="width:100%"
                    filterable
                    clearable>
                    <el-option
                      v-for="item in unitOptions"
                      :key="item.id"
                      :label="item.name"
                      :value="item.name">
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="保修类型：" prop="archiveCode">
                  <el-select v-model="form.archiveCode" placeholder="请选择保修类型" style="width:100%" clearable>
                    <el-option label="保内" value="保内"></el-option>
                    <el-option label="保外" value="保外"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="资产负责人：" prop="assetManager">
                  <el-select
                    v-model="form.assetManager"
                    placeholder="请选择资产负责人"
                    style="width:100%"
                    filterable
                    clearable>
                    <el-option
                      v-for="item in userOptions"
                      :key="item.id"
                      :label="item.name"
                      :value="item.name">
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="维修负责人：" prop="maintenanceManager">
                  <el-select
                    v-model="form.maintenanceManager"
                    placeholder="请选择维修负责人"
                    style="width:100%"
                    filterable
                    clearable>
                    <el-option
                      v-for="item in userOptions"
                      :key="item.id"
                      :label="item.name"
                      :value="item.name">
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <!-- 第四行 -->
            <el-row :gutter="20">
              <el-col :span="4" v-if="switchValue === '全部'">
                <el-form-item label="使用科室：" prop="useDepartment" required>
                  <el-select
                    v-model="form.useDepartment"
                    placeholder="请选择使用科室"
                    style="width:100%"
                    filterable
                    clearable>
                    <el-option
                      v-for="item in departmentOptions"
                      :key="item.id"
                      :label="item.name"
                      :value="item.id">
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="4" v-if="switchValue === '全部'">
                <el-form-item label="管理科室：" prop="manageDepartment">
                  <el-select
                    v-model="form.manageDepartment"
                    placeholder="请选择管理科室"
                    style="width:100%"
                    filterable
                    clearable>
                    <el-option
                      v-for="item in departmentOptions"
                      :key="item.id"
                      :label="item.name"
                      :value="item.id">
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="存放地点：" prop="storageLocation">
                  <el-input v-model="form.storageLocation"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="所属分类：" prop="assetType">
                  <el-select
                    v-model="form.assetType"
                    placeholder="请选择所属分类"
                    style="width:100%"
                    filterable
                    clearable
                    :filter-method="filterAssetCategory"
                    @change="handleAssetCategoryChange">
                    <el-option
                      v-for="item in filteredAssetCategoryOptions"
                      :key="item.id"
                      :label="item.name"
                      :value="item.name"
                      :data-code="item.code">
                      <span style="float: left">{{ item.name }}</span>
                      <span v-if="item.code" style="float: right; color: #8492a6; font-size: 13px">{{ item.code }}</span>
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="出厂编号：" prop="factoryNumber">
                  <el-input v-model="form.factoryNumber"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="出厂日期：" prop="productionDate">
                  <el-date-picker v-model="form.productionDate" type="date" style="width:100%"></el-date-picker>
                </el-form-item>
              </el-col>
            </el-row>

            <!-- 第五行 -->
            <el-row :gutter="20">
              <el-col :span="4">
                <el-form-item label="注册证件号：" prop="registrationNumber">
                  <el-input v-model="form.registrationNumber"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="预计开机工作日：" prop="expectedOperationDate">
                  <el-date-picker v-model="form.expectedOperationDate" type="date" style="width:100%"></el-date-picker>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="资金来源：" prop="fundSource">
                  <el-select v-model="form.fundSource" style="width:100%">
                    <el-option label="来源1" value="1"></el-option>
                    <el-option label="来源2" value="2"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="发票编号：" prop="invoiceNumber">
                  <el-input v-model="form.invoiceNumber"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="发票金额：" prop="invoiceAmount">
                  <el-input-number v-model="form.invoiceAmount" style="width:100%"></el-input-number>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="附资产标志：" prop="attachedAssetFlag">
                  <el-select v-model="form.attachedAssetFlag" style="width:100%">
                    <el-option label="是" value="1"></el-option>
                    <el-option label="否" value="0"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <!-- 第六行 -->
            <el-row :gutter="20">
              <el-col :span="4">
                <el-form-item label="设备功率：" prop="power">
                  <el-input v-model="form.power"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="理论开机时间：" prop="theoryOperationTime">
                  <el-input-number v-model="form.theoryOperationTime" style="width:100%"></el-input-number>
                  <span style="margin-left:10px">h/天</span>
                </el-form-item>
              </el-col>
            </el-row>

            <!-- 第七行 -->
            <el-row :gutter="20">
              <el-col :span="4">
                <el-form-item label="录入人：" prop="creator">
                  <el-input v-model="form.creator" :disabled="true"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="录入日期：" prop="createTime">
                  <el-date-picker
                    v-model="form.createTime"
                    type="datetime"
                    value-format="yyyy-MM-dd HH:mm:ss"
                    format="yyyy-MM-dd HH:mm:ss"
                    style="width:100%"
                    :disabled="true">
                  </el-date-picker>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="最后修改人：" prop="modifier">
                  <el-input v-model="form.modifier"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="最后修改时间：" prop="modifyTime">
                  <el-date-picker v-model="form.modifyTime" type="datetime" style="width:100%"></el-date-picker>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="档案使用情况：" prop="archiveUsage">
                  <el-select v-model="form.archiveUsage" style="width:100%">
                    <el-option label="是" value="1"></el-option>
                    <el-option label="否" value="0"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <!-- 第八行 -->
            <el-row :gutter="20">
              <el-col :span="4">
                <el-form-item label="合同与清单是否一致：" prop="contractConsistent">
                  <el-select v-model="form.contractConsistent" style="width:100%">
                    <el-option label="是" value="1"></el-option>
                    <el-option label="否" value="0"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="是否专网资产：" prop="specialNetworkAsset">
                  <el-select v-model="form.specialNetworkAsset" style="width:100%">
                    <el-option label="是" value="1"></el-option>
                    <el-option label="否" value="0"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="楼宇：" prop="building">
                  <el-input v-model="form.building"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="楼层：" prop="floor">
                  <el-input v-model="form.floor"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="数量：" prop="quantity">
                  <el-input-number v-model="form.quantity" style="width:100%"></el-input-number>
                </el-form-item>
              </el-col>
            </el-row>

            <!-- 第九行 -->
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="备注：" prop="remark">
                  <el-input v-model="form.remark" type="textarea"></el-input>
                </el-form-item>
              </el-col>
            </el-row>

            <!-- 附属资料容器 -->
            <el-row :gutter="20">
              <el-col :span="24">
                <div class="random-materials-container">
                  <div class="container-title">附属资料</div>
                  <div class="container-content">
                    <el-form-item prop="attachedMaterialsList" label-width="0">
                  <el-checkbox-group v-model="form.attachedMaterialsList">
                    <el-checkbox label="说明书"></el-checkbox>
                    <el-checkbox label="保修卡"></el-checkbox>
                    <el-checkbox label="合格证"></el-checkbox>
                    <el-checkbox label="检验报告书"></el-checkbox>
                    <el-checkbox label="报关单"></el-checkbox>
                  </el-checkbox-group>
                </el-form-item>
                  </div>
                </div>
              </el-col>
            </el-row>

            <!-- 第二个容器 -->
            <el-row :gutter="20">
              <el-col :span="24">
                <div class="additional-container">
                  <div class="container-title">附加信息</div>
                  <div class="container-content">
                    <el-form-item prop="additionalInfoList" label-width="0">
                      <el-checkbox-group v-model="form.additionalInfoList">
                        <el-checkbox label="急救/生命支持"></el-checkbox>
                        <el-checkbox label="特种设备"></el-checkbox>
                        <el-checkbox label="计量设备"></el-checkbox>
                        <el-checkbox label="效益分析"></el-checkbox>
                        <el-checkbox label="科研/科教"></el-checkbox>
                        <el-checkbox label="大型设备"></el-checkbox>
                        <el-checkbox label="中大型设备"></el-checkbox>
                        <el-checkbox label="中小型设备"></el-checkbox>
                        <el-checkbox label="中型设备"></el-checkbox>
                        <el-checkbox label="小型设备"></el-checkbox>
                        <el-checkbox label="公用设备"></el-checkbox>
                        <el-checkbox label="灭菌类"></el-checkbox>
                        <el-checkbox label="重点医学装备"></el-checkbox>
                        <el-checkbox label="压力容器类"></el-checkbox>
                      </el-checkbox-group>
                    </el-form-item>
                  </div>
                </div>
              </el-col>
            </el-row>

            <!-- 第十行 -->
            <el-row :gutter="20">
            </el-row>
          </el-form>
        </el-tab-pane>

        <!-- 资产卡片 -->
        <el-tab-pane label="资产卡片" name="assetCard">
          <div class="asset-card-container">
            <div class="asset-card-header">
              <el-button
                type="primary"
                icon="el-icon-printer"
                size="small"
                @click="handlePrintAssetCard"
                :disabled="!form.assetCode"
              >打印</el-button>
            </div>
            <div class="asset-card" v-if="form.assetCode">
              <!-- 卡片标题 -->
              <div class="asset-card-title">{{ hospitalName || '医院' }}固定资产</div>

              <!-- 卡片内容 -->
              <div class="asset-card-content">
                <!-- 左侧信息区域 -->
                <div class="asset-card-info">
                  <div class="asset-card-row">
                    <div class="asset-card-label">使用科室：</div>
                    <div class="asset-card-value">{{ getDepartmentName(form.useDepartment) || '--' }}</div>
                  </div>
                  <div class="asset-card-row">
                    <div class="asset-card-label">资产名称：</div>
                    <div class="asset-card-value">{{ form.assetName || '--' }}</div>
                  </div>
                  <div class="asset-card-row">
                    <div class="asset-card-label">卡片编号：</div>
                    <div class="asset-card-value">{{ form.barcode || '--' }}</div>
                  </div>
                  <div class="asset-card-row">
                    <div class="asset-card-label">原值(元)：</div>
                    <div class="asset-card-value">{{ form.originalPrice ? parseFloat(form.originalPrice).toFixed(2) : '--' }}</div>
                  </div>
                  <div class="asset-card-row">
                    <div class="asset-card-label">规格型号：</div>
                    <div class="asset-card-value">{{ (form.specification || '') + (form.model ? '/' + form.model : '') || '--' }}</div>
                  </div>
                  <div class="asset-card-row">
                    <div class="asset-card-label">购置日期：</div>
                    <div class="asset-card-value">{{ form.purchaseDate || '--' }}</div>
                  </div>
                  <div class="asset-card-row">
                    <div class="asset-card-label">管理部门：</div>
                    <div class="asset-card-value">{{ getDepartmentName(form.manageDepartment) || '--' }}</div>
                  </div>
                  <div class="asset-card-row">
                    <div class="asset-card-label">存放地点：</div>
                    <div class="asset-card-value">{{ form.storageLocation || '--' }}</div>
                  </div>
                </div>

                <!-- 右侧二维码区域 -->
                <div class="asset-card-qrcode">
                  <img
                    v-if="form.assetCode"
                    :src="getQRCodeUrl(form.assetCode)"
                    alt="二维码"
                    class="qrcode-image"
                  />
                </div>
              </div>
            </div>
            <div v-else class="asset-card-empty">
              <p>暂无数据</p>
            </div>
          </div>
          <!-- 打印组件 -->
          <asset-card-print v-if="printAssetCardData" :row="printAssetCardData" ref="assetCardPrintRefAuto"></asset-card-print>
        </el-tab-pane>

        <!-- 合同信息 -->
        <el-tab-pane label="合同信息" name="contract">
          <el-form ref="form" :model="form" label-width="120px">
            <!-- 维护条件容器 -->
            <el-row :gutter="20" v-show="false">
              <el-col :span="24">
                <div class="maintenance-container">
                  <div class="container-title">维护条件</div>
                  <div class="container-content">
            <el-row :gutter="20">
                      <el-col :span="6">
                <el-form-item label="合同名称：" prop="contractName">
                  <el-input v-model="form.contractName"></el-input>
                </el-form-item>
                      </el-col>
                      <el-col :span="6">
                <el-form-item label="合同价格：" prop="contractPrice">
                  <el-input-number v-model="form.contractPrice" style="width:100%"></el-input-number>
                </el-form-item>
                      </el-col>
                      <el-col :span="6">
                <el-form-item label="签订日期：" prop="signDate">
                  <el-date-picker v-model="form.signDate" type="date" style="width:100%"></el-date-picker>
                </el-form-item>
                      </el-col>
                      <el-col :span="6">
                <el-form-item label="购入日期：" prop="purchaseDate">
                  <el-date-picker v-model="form.purchaseDate" type="date" style="width:100%"></el-date-picker>
                </el-form-item>
                      </el-col>
                    </el-row>
                    <el-row :gutter="20">
                      <el-col :span="6">
                <el-form-item label="验收合格日期：" prop="acceptanceDate">
                  <el-date-picker v-model="form.acceptanceDate" type="date" style="width:100%"></el-date-picker>
                </el-form-item>
                      </el-col>
                      <el-col :span="6">
                <el-form-item label="送审时间：" prop="reviewTime">
                  <el-date-picker v-model="form.reviewTime" type="datetime" style="width:100%"></el-date-picker>
                </el-form-item>
              </el-col>
                      <el-col :span="6">
                <el-form-item label="中标日期：" prop="bidDate">
                  <el-date-picker v-model="form.bidDate" type="date" style="width:100%"></el-date-picker>
                </el-form-item>
                      </el-col>
                      <el-col :span="6">
                <el-form-item label="通知供货时间：" prop="supplyNoticeDate">
                  <el-date-picker v-model="form.supplyNoticeDate" type="date" style="width:100%"></el-date-picker>
                </el-form-item>
                      </el-col>
                    </el-row>
                    <el-row :gutter="20">
                      <el-col :span="6">
                <el-form-item label="首次验收日期：" prop="firstAcceptanceDate">
                  <el-date-picker v-model="form.firstAcceptanceDate" type="date" style="width:100%"></el-date-picker>
                </el-form-item>
                      </el-col>
                      <el-col :span="6">
                <el-form-item label="交货截止日期：" prop="deliveryDeadline">
                  <el-date-picker v-model="form.deliveryDeadline" type="date" style="width:100%"></el-date-picker>
                </el-form-item>
                      </el-col>
                      <el-col :span="6">
                <el-form-item label="二次验收日期：" prop="secondAcceptanceDate">
                  <el-date-picker v-model="form.secondAcceptanceDate" type="date" style="width:100%"></el-date-picker>
                </el-form-item>
                      </el-col>
                      <el-col :span="6">
                        <el-form-item label="保修到期：" prop="warrantyExpireDate">
                          <el-date-picker v-model="form.warrantyExpireDate" type="date" style="width:100%"></el-date-picker>
                        </el-form-item>
                      </el-col>
                    </el-row>
                    <el-row :gutter="20">
                      <el-col :span="6">
                <el-form-item label="出保日期：" prop="warrantyOutDate">
                  <el-date-picker v-model="form.warrantyOutDate" type="date" style="width:100%"></el-date-picker>
                </el-form-item>
                      </el-col>
                    </el-row>
                  </div>
                </div>
              </el-col>
            </el-row>

            <!-- 明细表格 -->
            <el-row :gutter="20">
              <el-col :span="24">
                <el-table
                  :data="form.contractDetailList"
                  border
                  class="contract-detail-table"
                  style="width: 100%"
                  :header-cell-style="{ background: '#f5f7fa', color: '#606266' }">
                  <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
                  <el-table-column prop="contractType" label="合同类型" width="120" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.contractType" placeholder="请输入合同类型"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="contractCode" label="合同编号" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.contractCode" placeholder="请输入合同编号"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="contractName" label="合同名称" width="180" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.contractName" placeholder="请输入合同名称"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="contractPartyA" label="合同甲方" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.contractPartyA" placeholder="请输入合同甲方"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="signer" label="签约人" width="120" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.signer" placeholder="请输入签约人"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="signDate" label="日期" width="150" align="center">
                    <template slot-scope="scope">
                      <el-date-picker v-model="scope.row.signDate" type="date" style="width:100%" placeholder="请选择日期"></el-date-picker>
                    </template>
                  </el-table-column>
                  <el-table-column prop="maintenanceDate" label="维保日期" width="150" align="center">
                    <template slot-scope="scope">
                      <el-date-picker v-model="scope.row.maintenanceDate" type="date" style="width:100%" placeholder="请选择维保日期"></el-date-picker>
                    </template>
                  </el-table-column>
                  <el-table-column prop="contractAmount" label="合同金额" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input-number v-model="scope.row.contractAmount" style="width:100%" :precision="2"></el-input-number>
                    </template>
                  </el-table-column>
                  <el-table-column prop="maintenanceCompany" label="维修公司" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.maintenanceCompany" placeholder="请输入维修公司"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="maintenancePhone" label="维修电话" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.maintenancePhone" placeholder="请输入维修电话"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="projectNumber" label="立项编号" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.projectNumber" placeholder="请输入立项编号"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="purchaseMethod" label="采购方式" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.purchaseMethod" placeholder="请输入采购方式"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="fundSource" label="资金来源" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.fundSource" placeholder="请输入资金来源"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="remark" label="备注" width="200" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.remark" type="textarea" :rows="1" placeholder="请输入备注"></el-input>
                    </template>
                  </el-table-column>
                </el-table>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <!-- 文档管理 -->
        <el-tab-pane label="文档管理" name="manufacturer">
          <div class="document-management-container">
            <!-- 顶部工具栏 -->
            <div class="document-toolbar">
              <el-input
                v-model="documentSearchName"
                placeholder="文档名称"
                style="width: 200px; margin-right: 10px;"
                clearable
                @keyup.enter.native="handleDocumentSearch"
              >
                <el-button slot="append" icon="el-icon-search" @click="handleDocumentSearch"></el-button>
              </el-input>
              <el-button type="primary" icon="el-icon-folder-opened" @click="handleSelectFile">1选择文件</el-button>
              <el-button type="primary" icon="el-icon-upload2" @click="handleDocumentUpload">2上传</el-button>
              <el-button type="warning" icon="el-icon-download" @click="handleDocumentDownload" :disabled="documentSelectedFiles.length === 0">选中下载</el-button>
              <el-button type="warning" @click="handleDocumentCopy" :disabled="documentSelectedFiles.length === 0">选中复制到...</el-button>
              <el-button type="danger" icon="el-icon-delete" @click="handleDocumentDelete" :disabled="documentSelectedFiles.length === 0">选中删除</el-button>
              <el-button type="success" icon="el-icon-view" @click="handleDocumentPreview" :disabled="documentSelectedFiles.length !== 1">Q预览图片</el-button>
            </div>

            <!-- 主内容区域 -->
            <div class="document-content">
              <!-- 左侧文件类型 -->
              <div class="document-file-type-box">
                <div class="file-list-header">
                  <span>文件类型</span>
                </div>
                <div class="file-type-content">
                  <el-radio-group v-model="selectedDocumentType" size="small">
                    <div class="file-type-item-row">
                      <el-radio
                        v-for="(type, index) in filteredDocumentTypeList"
                        :key="type.value"
                        :label="type.value"
                        class="file-type-radio"
                      >{{ type.label }}</el-radio>
                    </div>
                  </el-radio-group>
                </div>
              </div>

              <!-- 中间文件列表 -->
              <div class="document-file-list-box">
                <div class="file-list-header">
                  <span>文件列表</span>
                </div>
                <div class="file-list-content">
                  <div
                    v-for="file in filteredDocumentList"
                    :key="file.id"
                    class="file-list-item"
                    :class="{ 'active': previewFile && previewFile.id === file.id, 'selected': isFileSelected(file) }"
                    @click="handleFileItemClick(file)"
                  >
                    <i :class="getFileIcon(file)" style="margin-right: 8px;"></i>
                    <span class="file-list-name" :title="file.name">{{ file.name }}</span>
                  </div>
                  <div v-if="filteredDocumentList.length === 0" class="file-list-empty">
                    暂无文件
                  </div>
                </div>
              </div>

              <!-- 右侧文件预览框 -->
              <div class="image-preview-box">
                <div class="preview-box-header">
                  <span>文件预览</span>
                </div>
                <div class="preview-box-content">
                  <div v-if="previewFile" class="preview-image-wrapper">
                    <img v-if="isImageFile(previewFile)" :src="previewFile.url" alt="预览" class="preview-image-full" @dblclick="handleImageDoubleClick" />
                    <iframe v-else-if="isPdfFile(previewFile)" :src="previewFile.url" class="preview-pdf-iframe" frameborder="0"></iframe>
                    <div v-else class="preview-file-info">
                      <i class="el-icon-document" style="font-size: 48px; color: #909399; margin-bottom: 10px;"></i>
                      <div class="preview-file-name">{{ previewFile.name }}</div>
                      <div class="preview-file-type">{{ getDocumentTypeLabel(previewFile.type) || '未知类型' }}</div>
                    </div>
                  </div>
                  <div v-else class="preview-placeholder-box">
                    <div class="preview-placeholder-text">请从列表中选择文件进行预览</div>
                  </div>
                </div>
              </div>

              <!-- 图片查看对话框 -->
              <el-dialog
                title="图片查看"
                :visible.sync="imageViewerVisible"
                width="90%"
                :before-close="handleImageViewerClose"
                custom-class="image-viewer-dialog"
              >
                <div class="image-viewer-container" @wheel.prevent="handleImageWheel">
                  <img
                    ref="viewerImage"
                    :src="viewerImageUrl"
                    alt="查看图片"
                    class="viewer-image"
                    :style="{ transform: `scale(${imageScale})`, transformOrigin: 'center center' }"
                    @mousedown="handleImageMouseDown"
                    @mousemove="handleImageMouseMove"
                    @mouseup="handleImageMouseUp"
                    @mouseleave="handleImageMouseUp"
                  />
                </div>
                <div slot="footer" class="dialog-footer">
                  <el-button @click="resetImageScale">重置</el-button>
                  <el-button @click="zoomOut">缩小</el-button>
                  <el-button @click="zoomIn">放大</el-button>
                  <span class="scale-info">缩放比例: {{ Math.round(imageScale * 100) }}%</span>
                </div>
              </el-dialog>
            </div>
          </div>
          <!-- 隐藏的文件选择input -->
          <input ref="documentFileInput" type="file" multiple style="display: none;" @change="handleFileSelect">
        </el-tab-pane>

        <!-- 附属配件 -->
        <el-tab-pane label="附属配件" name="bidding">
          <el-form ref="form" :model="form" label-width="120px">
            <!-- 明细表格 -->
            <el-row :gutter="20">
              <el-col :span="24">
                <el-table
                  :data="form.accessoryDetailList"
                  border
                  class="contract-detail-table"
                  style="width: 100%"
                  :header-cell-style="{ background: '#f5f7fa', color: '#606266' }">
                  <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
                  <el-table-column prop="barcode" label="住条码" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.barcode" placeholder="请输入住条码"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="accessoryName" label="配件名称" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.accessoryName" placeholder="请输入配件名称"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="accessoryCode" label="配件编号" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.accessoryCode" placeholder="请输入配件编号"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="accessorySerialNumber" label="配件序列号" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.accessorySerialNumber" placeholder="请输入配件序列号"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="accessorySpecification" label="配件规格型号" width="180" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.accessorySpecification" placeholder="请输入配件规格型号"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="quantity" label="数量" width="120" align="center">
                    <template slot-scope="scope">
                      <el-input-number v-model="scope.row.quantity" style="width:100%" :min="0" :precision="0" @change="calculateTotalValue(scope.row)"></el-input-number>
                    </template>
                  </el-table-column>
                  <el-table-column prop="unitPrice" label="单价" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input-number v-model="scope.row.unitPrice" style="width:100%" :min="0" :precision="2" @change="calculateTotalValue(scope.row)"></el-input-number>
                    </template>
                  </el-table-column>
                  <el-table-column prop="totalValue" label="总价值" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input-number v-model="scope.row.totalValue" style="width:100%" :min="0" :precision="2" :disabled="true"></el-input-number>
                    </template>
                  </el-table-column>
                  <el-table-column prop="useStatus" label="使用状态" width="150" align="center">
                    <template slot-scope="scope">
                      <el-select v-model="scope.row.useStatus" style="width:100%" placeholder="请选择使用状态">
                        <el-option label="正常使用" value="正常使用"></el-option>
                        <el-option label="停用" value="停用"></el-option>
                        <el-option label="维修中" value="维修中"></el-option>
                        <el-option label="报废" value="报废"></el-option>
                      </el-select>
                    </template>
                  </el-table-column>
                </el-table>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <!-- 转移记录 -->
        <el-tab-pane label="转移记录" name="transferRecord">
          <el-form ref="form" :model="form" label-width="120px">
            <!-- 明细表格 -->
            <el-row :gutter="20">
              <el-col :span="24">
                <el-table
                  :data="form.transferRecordList"
                  border
                  class="contract-detail-table"
                  style="width: 100%"
                  :header-cell-style="{ background: '#f5f7fa', color: '#606266' }">
                  <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
                  <el-table-column prop="deviceBarcode" label="设备条形码" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.deviceBarcode" placeholder="请输入设备条形码"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="changeCount" label="变动次数" width="120" align="center">
                    <template slot-scope="scope">
                      <el-input-number v-model="scope.row.changeCount" style="width:100%" :min="0" :precision="0"></el-input-number>
                    </template>
                  </el-table-column>
                  <el-table-column prop="approvalNumber" label="审批单号" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.approvalNumber" placeholder="请输入审批单号"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="deviceName" label="设备名称" width="180" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.deviceName" placeholder="请输入设备名称"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="originalDepartment" label="原科室" width="150" align="center">
                    <template slot-scope="scope">
                      <el-select v-model="scope.row.originalDepartment" style="width:100%" placeholder="请选择原科室" filterable>
                        <el-option
                          v-for="dept in departmentOptions"
                          :key="dept.id"
                          :label="dept.name"
                          :value="dept.id">
                        </el-option>
                      </el-select>
                    </template>
                  </el-table-column>
                  <el-table-column prop="newDepartment" label="新科室" width="150" align="center">
                    <template slot-scope="scope">
                      <el-select v-model="scope.row.newDepartment" style="width:100%" placeholder="请选择新科室" filterable>
                        <el-option
                          v-for="dept in departmentOptions"
                          :key="dept.id"
                          :label="dept.name"
                          :value="dept.id">
                        </el-option>
                      </el-select>
                    </template>
                  </el-table-column>
                  <el-table-column prop="applicant" label="申请人" width="150" align="center">
                    <template slot-scope="scope">
                      <el-select v-model="scope.row.applicant" style="width:100%" placeholder="请选择申请人" filterable>
                        <el-option
                          v-for="user in userOptions"
                          :key="user.id"
                          :label="user.name"
                          :value="user.id">
                        </el-option>
                      </el-select>
                    </template>
                  </el-table-column>
                  <el-table-column prop="applicationDate" label="申请日期" width="150" align="center">
                    <template slot-scope="scope">
                      <el-date-picker v-model="scope.row.applicationDate" type="date" style="width:100%" placeholder="请选择申请日期"></el-date-picker>
                    </template>
                  </el-table-column>
                  <el-table-column prop="changeReason" label="变动原因" width="200" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.changeReason" type="textarea" :rows="1" placeholder="请输入变动原因"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="auditor" label="审核人" width="150" align="center">
                    <template slot-scope="scope">
                      <el-select v-model="scope.row.auditor" style="width:100%" placeholder="请选择审核人" filterable>
                        <el-option
                          v-for="user in userOptions"
                          :key="user.id"
                          :label="user.name"
                          :value="user.id">
                        </el-option>
                      </el-select>
                    </template>
                  </el-table-column>
                  <el-table-column prop="auditDate" label="审核日期" width="150" align="center">
                    <template slot-scope="scope">
                      <el-date-picker v-model="scope.row.auditDate" type="date" style="width:100%" placeholder="请选择审核日期"></el-date-picker>
                    </template>
                  </el-table-column>
                </el-table>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <!-- 维修档案 -->
        <el-tab-pane label="维修档案" name="maintenanceRecord">
          <el-form ref="form" :model="form" label-width="120px">
            <!-- 明细表格 -->
            <el-row :gutter="20">
              <el-col :span="24">
                <el-table
                  :data="form.maintenanceRecordList"
                  border
                  class="contract-detail-table"
                  style="width: 100%"
                  :header-cell-style="{ background: '#f5f7fa', color: '#606266' }">
                  <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
                  <el-table-column prop="maintenanceStatus" label="维修状态" width="120" align="center">
                    <template slot-scope="scope">
                      <el-select v-model="scope.row.maintenanceStatus" style="width:100%" placeholder="请选择维修状态">
                        <el-option label="待维修" value="待维修"></el-option>
                        <el-option label="维修中" value="维修中"></el-option>
                        <el-option label="已完成" value="已完成"></el-option>
                        <el-option label="已取消" value="已取消"></el-option>
                      </el-select>
                    </template>
                  </el-table-column>
                  <el-table-column prop="maintenanceOrderNumber" label="维修单号" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.maintenanceOrderNumber" placeholder="请输入维修单号"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="deviceName" label="设备名称" width="180" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.deviceName" placeholder="请输入设备名称"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="department" label="所在科室" width="150" align="center">
                    <template slot-scope="scope">
                      <el-select v-model="scope.row.department" style="width:100%" placeholder="请选择所在科室" filterable>
                        <el-option
                          v-for="dept in departmentOptions"
                          :key="dept.id"
                          :label="dept.name"
                          :value="dept.id">
                        </el-option>
                      </el-select>
                    </template>
                  </el-table-column>
                  <el-table-column prop="maintenanceDate" label="维修日期" width="150" align="center">
                    <template slot-scope="scope">
                      <el-date-picker v-model="scope.row.maintenanceDate" type="date" style="width:100%" placeholder="请选择维修日期"></el-date-picker>
                    </template>
                  </el-table-column>
                  <el-table-column prop="warrantyPeriod" label="保修期限" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.warrantyPeriod" placeholder="请输入保修期限"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="warrantyContent" label="保修内容" width="200" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.warrantyContent" type="textarea" :rows="1" placeholder="请输入保修内容"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="maintenanceEngineer" label="维修工程师" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.maintenanceEngineer" placeholder="请输入维修工程师"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="maintenanceCost" label="维修费用" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input-number v-model="scope.row.maintenanceCost" style="width:100%" :min="0" :precision="2"></el-input-number>
                    </template>
                  </el-table-column>
                  <el-table-column prop="workHours" label="工时" width="120" align="center">
                    <template slot-scope="scope">
                      <el-input-number v-model="scope.row.workHours" style="width:100%" :min="0" :precision="1"></el-input-number>
                    </template>
                  </el-table-column>
                  <el-table-column prop="warrantyPerson" label="保修人" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.warrantyPerson" placeholder="请输入保修人"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="warrantyTime" label="保修时间" width="150" align="center">
                    <template slot-scope="scope">
                      <el-date-picker v-model="scope.row.warrantyTime" type="date" style="width:100%" placeholder="请选择保修时间"></el-date-picker>
                    </template>
                  </el-table-column>
                  <el-table-column prop="faultDescription" label="故障描述" width="200" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.faultDescription" type="textarea" :rows="1" placeholder="请输入故障描述"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="maintenanceResult" label="维修结果" width="200" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.maintenanceResult" type="textarea" :rows="1" placeholder="请输入维修结果"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="accessoryAmount" label="配件金额" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input-number v-model="scope.row.accessoryAmount" style="width:100%" :min="0" :precision="2"></el-input-number>
                    </template>
                  </el-table-column>
                  <el-table-column prop="contactPhone" label="联系电话" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.contactPhone" placeholder="请输入联系电话"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="remark" label="备注" width="200" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.remark" type="textarea" :rows="1" placeholder="请输入备注"></el-input>
                    </template>
                  </el-table-column>
                </el-table>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <!-- 保养记录 -->
        <el-tab-pane label="保养记录" name="careRecord">
          <el-form ref="form" :model="form" label-width="120px">
            <!-- 明细表格 -->
            <el-row :gutter="20">
              <el-col :span="24">
                <el-table
                  :data="form.careRecordList"
                  border
                  class="contract-detail-table"
                  style="width: 100%"
                  :header-cell-style="{ background: '#f5f7fa', color: '#606266' }">
                  <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
                  <el-table-column prop="careLevel" label="保养级别" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.careLevel" placeholder="请输入保养级别"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="archiveCode" label="当前设备档案编码" width="180" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.archiveCode" placeholder="请输入当前设备档案编码"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="careDate" label="保养日期" width="150" align="center">
                    <template slot-scope="scope">
                      <el-date-picker v-model="scope.row.careDate" type="date" style="width:100%" placeholder="请选择保养日期"></el-date-picker>
                    </template>
                  </el-table-column>
                  <el-table-column prop="careProject" label="保养项目" width="200" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.careProject" type="textarea" :rows="1" placeholder="请输入保养项目"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="careResult" label="保养结果" width="200" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.careResult" type="textarea" :rows="1" placeholder="请输入保养结果"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="carePerson" label="保养人" width="150" align="center">
                    <template slot-scope="scope">
                      <el-select v-model="scope.row.carePerson" style="width:100%" placeholder="请选择保养人" filterable>
                        <el-option
                          v-for="user in userOptions"
                          :key="user.id"
                          :label="user.name"
                          :value="user.id">
                        </el-option>
                      </el-select>
                    </template>
                  </el-table-column>
                  <el-table-column prop="acceptancePerson" label="验收人" width="150" align="center">
                    <template slot-scope="scope">
                      <el-select v-model="scope.row.acceptancePerson" style="width:100%" placeholder="请选择验收人" filterable>
                        <el-option
                          v-for="user in userOptions"
                          :key="user.id"
                          :label="user.name"
                          :value="user.id">
                        </el-option>
                      </el-select>
                    </template>
                  </el-table-column>
                  <el-table-column prop="acceptanceDate" label="验收日期" width="150" align="center">
                    <template slot-scope="scope">
                      <el-date-picker v-model="scope.row.acceptanceDate" type="date" style="width:100%" placeholder="请选择验收日期"></el-date-picker>
                    </template>
                  </el-table-column>
                  <el-table-column prop="careNumber" label="保养编号" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.careNumber" placeholder="请输入保养编号"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="remark" label="备注" width="200" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.remark" type="textarea" :rows="1" placeholder="请输入备注"></el-input>
                    </template>
                  </el-table-column>
                </el-table>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <!-- 计量检测 -->
        <el-tab-pane label="计量检测" name="measurementTest">
          <el-form ref="form" :model="form" label-width="120px">
            <!-- 明细表格 -->
            <el-row :gutter="20">
              <el-col :span="24">
                <el-table
                  :data="form.measurementTestList"
                  border
                  class="contract-detail-table"
                  style="width: 100%"
                  :header-cell-style="{ background: '#f5f7fa', color: '#606266' }">
                  <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
                  <el-table-column prop="archiveCode" label="设备档案号" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.archiveCode" placeholder="请输入设备档案号"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="deviceName" label="设备名称" width="180" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.deviceName" placeholder="请输入设备名称"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="testDate" label="检测时间" width="150" align="center">
                    <template slot-scope="scope">
                      <el-date-picker v-model="scope.row.testDate" type="date" style="width:100%" placeholder="请选择检测时间"></el-date-picker>
                    </template>
                  </el-table-column>
                  <el-table-column prop="testInstitution" label="检测机构" width="180" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.testInstitution" placeholder="请输入检测机构"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="certificateNumber" label="证书/检验报告编号" width="200" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.certificateNumber" placeholder="请输入证书/检验报告编号"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="testResult" label="检测结果" width="200" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.testResult" type="textarea" :rows="1" placeholder="请输入检测结果"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="testCost" label="检测费用" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input-number v-model="scope.row.testCost" style="width:100%" :min="0" :precision="2"></el-input-number>
                    </template>
                  </el-table-column>
                  <el-table-column prop="contactPhone" label="联系电话" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.contactPhone" placeholder="请输入联系电话"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="measurementStatus" label="计量状态" width="150" align="center">
                    <template slot-scope="scope">
                      <el-select v-model="scope.row.measurementStatus" style="width:100%" placeholder="请选择计量状态">
                        <el-option label="合格" value="合格"></el-option>
                        <el-option label="不合格" value="不合格"></el-option>
                        <el-option label="待检测" value="待检测"></el-option>
                        <el-option label="已过期" value="已过期"></el-option>
                      </el-select>
                    </template>
                  </el-table-column>
                  <el-table-column prop="remark" label="备注" width="200" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.remark" type="textarea" :rows="1" placeholder="请输入备注"></el-input>
                    </template>
                  </el-table-column>
                </el-table>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <!-- 设备图片 -->
        <el-tab-pane label="设备图片" name="deviceImage">
          <div class="device-image-container">
            <!-- 顶部工具栏 -->
            <div class="device-image-toolbar">
              <input
                ref="deviceImageFileInput"
                type="file"
                accept="image/*"
                style="display: none;"
                @change="handleDeviceImageFileSelect"
              />
              <el-button type="primary" icon="el-icon-folder-opened" @click="handleSelectDeviceImageFile">选择文件</el-button>
              <el-button type="primary" icon="el-icon-upload2" @click="handleDeviceImageUpload" :disabled="!selectedDeviceImageFile">上传</el-button>
              <el-button type="warning" icon="el-icon-download" @click="handleDeviceImageDownload" :disabled="deviceImageSelectedIndex === -1">下载</el-button>
              <el-button type="success" icon="el-icon-view" @click="handleDeviceImagePreview" :disabled="deviceImageSelectedIndex === -1">预览</el-button>
            </div>

            <!-- 底部图片展示区域 -->
            <div class="device-image-gallery">
              <div v-if="form.deviceImageList && form.deviceImageList.length > 0" class="image-grid">
                <div
                  v-for="(image, index) in form.deviceImageList"
                  :key="index"
                  class="image-item"
                  :class="{ 'selected': deviceImageSelectedIndex === index }"
                  @click="deviceImageSelectedIndex = index"
                >
                  <div class="image-wrapper">
                    <img :src="image.imageUrl" alt="设备图片" @error="handleImageError" />
                    <div class="image-overlay">
                      <div class="image-info">
                        <div class="image-date">{{ formatDate(image.uploadDate) }}</div>
                        <div class="image-uploader">{{ getUserName(image.uploadPerson) }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="image-empty">
                <i class="el-icon-picture-outline" style="font-size: 48px; color: #c0c4cc;"></i>
                <div style="margin-top: 10px; color: #909399;">暂无图片</div>
              </div>
            </div>
          </div>

          <!-- 图片预览对话框 -->
          <el-dialog
            title="图片预览"
            :visible.sync="deviceImagePreviewVisible"
            width="90%"
            custom-class="device-image-preview-dialog"
          >
            <div class="preview-image-container" v-if="deviceImageSelectedIndex >= 0 && form.deviceImageList[deviceImageSelectedIndex]">
              <img :src="form.deviceImageList[deviceImageSelectedIndex].imageUrl" alt="预览" class="preview-image-full" />
            </div>
          </el-dialog>
        </el-tab-pane>

        <!-- 同类设备分布 -->
        <el-tab-pane label="同类设备分布" name="similarDevice">
          <el-form ref="form" :model="form" label-width="120px">
            <!-- 明细表格 -->
            <el-row :gutter="20">
              <el-col :span="24">
                <el-table
                  :data="form.similarDeviceList"
                  border
                  class="contract-detail-table"
                  style="width: 100%"
                  :header-cell-style="{ background: '#f5f7fa', color: '#606266' }">
                  <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
                  <el-table-column prop="useStatus" label="使用状态" width="120" align="center">
                    <template slot-scope="scope">
                      <el-select v-model="scope.row.useStatus" style="width:100%" placeholder="请选择使用状态">
                        <el-option label="正常使用" value="正常使用"></el-option>
                        <el-option label="停用" value="停用"></el-option>
                        <el-option label="维修中" value="维修中"></el-option>
                        <el-option label="报废" value="报废"></el-option>
                      </el-select>
                    </template>
                  </el-table-column>
                  <el-table-column prop="archiveCode" label="设备档案号" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.archiveCode" placeholder="请输入设备档案号"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="deviceName" label="设备名称" width="180" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.deviceName" placeholder="请输入设备名称"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="specification" label="规格" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.specification" placeholder="请输入规格"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="model" label="型号" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.model" placeholder="请输入型号"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="enableDate" label="启用日期" width="150" align="center">
                    <template slot-scope="scope">
                      <el-date-picker v-model="scope.row.enableDate" type="date" style="width:100%" placeholder="请选择启用日期"></el-date-picker>
                    </template>
                  </el-table-column>
                  <el-table-column prop="unitPrice" label="单价" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input-number v-model="scope.row.unitPrice" style="width:100%" :min="0" :precision="2"></el-input-number>
                    </template>
                  </el-table-column>
                  <el-table-column prop="useDepartment" label="使用科室" width="150" align="center" v-if="switchValue !== '仓库'">
                    <template slot-scope="scope">
                      <el-select v-model="scope.row.useDepartment" style="width:100%" placeholder="请选择使用科室" filterable>
                        <el-option
                          v-for="dept in departmentOptions"
                          :key="dept.id"
                          :label="dept.name"
                          :value="dept.id">
                        </el-option>
                      </el-select>
                    </template>
                  </el-table-column>
                  <el-table-column prop="supplier" label="供货商" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.supplier" placeholder="请输入供货商"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="originalDeviceCode" label="原设备编码" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.originalDeviceCode" placeholder="请输入原设备编码"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="brand" label="品牌" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.brand" placeholder="请输入品牌"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="storageNo" label="单号" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.storageNo || '--' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="serialNumber" label="序列号" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.serialNumber" placeholder="请输入序列号"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="category" label="所属分类" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.category" placeholder="请输入所属分类"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="productionDate" label="出厂日期" width="150" align="center">
                    <template slot-scope="scope">
                      <el-date-picker v-model="scope.row.productionDate" type="date" style="width:100%" placeholder="请选择出厂日期"></el-date-picker>
                    </template>
                  </el-table-column>
                  <el-table-column prop="financialCode" label="财务编码" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.financialCode" placeholder="请输入财务编码"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="factoryCode" label="出厂编码" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.factoryCode" placeholder="请输入出厂编码"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="maintenanceStatus" label="维保状态" width="150" align="center">
                    <template slot-scope="scope">
                      <el-select v-model="scope.row.maintenanceStatus" style="width:100%" placeholder="请选择维保状态">
                        <el-option label="在保" value="在保"></el-option>
                        <el-option label="出保" value="出保"></el-option>
                        <el-option label="未知" value="未知"></el-option>
                      </el-select>
                    </template>
                  </el-table-column>
                  <el-table-column prop="serviceLife" label="使用年限" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input-number v-model="scope.row.serviceLife" style="width:100%" :min="0" :precision="1"></el-input-number>
                    </template>
                  </el-table-column>
                </el-table>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <!-- 巡检记录 -->
        <el-tab-pane label="巡检记录" name="inspectionRecord">
          <el-form ref="form" :model="form" label-width="120px">
            <!-- 明细表格 -->
            <el-row :gutter="20">
              <el-col :span="24">
                <el-table
                  :data="form.inspectionRecordList"
                  border
                  class="contract-detail-table"
                  style="width: 100%"
                  :header-cell-style="{ background: '#f5f7fa', color: '#606266' }">
                  <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
                  <el-table-column prop="inspectionCode" label="巡检编码" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.inspectionCode" placeholder="请输入巡检编码"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="archiveCode" label="当前设备档案编码" width="180" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.archiveCode" placeholder="请输入当前设备档案编码"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="inspectionDate" label="巡检日期" width="150" align="center">
                    <template slot-scope="scope">
                      <el-date-picker v-model="scope.row.inspectionDate" type="date" style="width:100%" placeholder="请选择巡检日期"></el-date-picker>
                    </template>
                  </el-table-column>
                  <el-table-column prop="inspectionPerson" label="巡检人" width="150" align="center">
                    <template slot-scope="scope">
                      <el-select v-model="scope.row.inspectionPerson" style="width:100%" placeholder="请选择巡检人" filterable>
                        <el-option
                          v-for="user in userOptions"
                          :key="user.id"
                          :label="user.name"
                          :value="user.id">
                        </el-option>
                      </el-select>
                    </template>
                  </el-table-column>
                  <el-table-column prop="inspectionProject" label="巡检项目" width="200" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.inspectionProject" type="textarea" :rows="1" placeholder="请输入巡检项目"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="inspectionProjectDetail" label="巡检项目明细" width="200" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.inspectionProjectDetail" type="textarea" :rows="1" placeholder="请输入巡检项目明细"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="inspectionResult" label="巡检结果" width="200" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.inspectionResult" type="textarea" :rows="1" placeholder="请输入巡检结果"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="reasonAnalysis" label="原因分析" width="200" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.reasonAnalysis" type="textarea" :rows="1" placeholder="请输入原因分析"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="improvementMeasures" label="改进措施" width="200" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.improvementMeasures" type="textarea" :rows="1" placeholder="请输入改进措施"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="logisticsImplementation" label="后勤落实情况" width="200" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.logisticsImplementation" type="textarea" :rows="1" placeholder="请输入后勤落实情况"></el-input>
                    </template>
                  </el-table-column>
                </el-table>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <!-- 质量检测 -->
        <el-tab-pane label="质量检测" name="qualityTest">
          <el-form ref="form" :model="form" label-width="120px">
            <!-- 明细表格 -->
            <el-row :gutter="20">
              <el-col :span="24">
                <el-table
                  :data="form.qualityTestList"
                  border
                  class="contract-detail-table"
                  style="width: 100%"
                  :header-cell-style="{ background: '#f5f7fa', color: '#606266' }">
                  <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
                  <el-table-column prop="qualityControlNumber" label="质控编号" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.qualityControlNumber" placeholder="请输入质控编号"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="archiveCode" label="当前设备档案编码" width="180" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.archiveCode" placeholder="请输入当前设备档案编码"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="testDate" label="日期" width="150" align="center">
                    <template slot-scope="scope">
                      <el-date-picker v-model="scope.row.testDate" type="date" style="width:100%" placeholder="请选择日期"></el-date-picker>
                    </template>
                  </el-table-column>
                  <el-table-column prop="qualityControlPerson" label="质控检测人" width="150" align="center">
                    <template slot-scope="scope">
                      <el-select v-model="scope.row.qualityControlPerson" style="width:100%" placeholder="请选择质控检测人" filterable>
                        <el-option
                          v-for="user in userOptions"
                          :key="user.id"
                          :label="user.name"
                          :value="user.id">
                        </el-option>
                      </el-select>
                    </template>
                  </el-table-column>
                  <el-table-column prop="qualityControlProject" label="质控项目" width="200" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.qualityControlProject" type="textarea" :rows="1" placeholder="请输入质控项目"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="projectReferenceValue" label="项目参考值" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.projectReferenceValue" placeholder="请输入项目参考值"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="qualityControlResult" label="质控检测结果" width="200" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.qualityControlResult" type="textarea" :rows="1" placeholder="请输入质控检测结果"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="conclusion" label="结论" width="200" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.conclusion" type="textarea" :rows="1" placeholder="请输入结论"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="remark" label="备注" width="200" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.remark" type="textarea" :rows="1" placeholder="请输入备注"></el-input>
                    </template>
                  </el-table-column>
                </el-table>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <!-- 培训记录 -->
        <el-tab-pane label="培训记录" name="trainingRecord">
          <el-form ref="form" :model="form" label-width="120px">
            <!-- 明细表格 -->
            <el-row :gutter="20">
              <el-col :span="24">
                <el-table
                  :data="form.trainingRecordList"
                  border
                  class="contract-detail-table"
                  style="width: 100%"
                  :header-cell-style="{ background: '#f5f7fa', color: '#606266' }">
                  <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
                  <el-table-column prop="trainingCode" label="培训编码" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.trainingCode" placeholder="请输入培训编码"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="archiveCode" label="当前设备档案编码" width="180" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.archiveCode" placeholder="请输入当前设备档案编码"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="trainingDate" label="培训日期" width="150" align="center">
                    <template slot-scope="scope">
                      <el-date-picker v-model="scope.row.trainingDate" type="date" style="width:100%" placeholder="请选择培训日期"></el-date-picker>
                    </template>
                  </el-table-column>
                  <el-table-column prop="trainingPerson" label="培训人" width="150" align="center">
                    <template slot-scope="scope">
                      <el-select v-model="scope.row.trainingPerson" style="width:100%" placeholder="请选择培训人" filterable>
                        <el-option
                          v-for="user in userOptions"
                          :key="user.id"
                          :label="user.name"
                          :value="user.id">
                        </el-option>
                      </el-select>
                    </template>
                  </el-table-column>
                  <el-table-column prop="trainee" label="受训人" width="150" align="center">
                    <template slot-scope="scope">
                      <el-select v-model="scope.row.trainee" style="width:100%" placeholder="请选择受训人" filterable>
                        <el-option
                          v-for="user in userOptions"
                          :key="user.id"
                          :label="user.name"
                          :value="user.id">
                        </el-option>
                      </el-select>
                    </template>
                  </el-table-column>
                  <el-table-column prop="trainingContent" label="培训内容" width="200" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.trainingContent" type="textarea" :rows="1" placeholder="请输入培训内容"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="trainingResult" label="培训结果" width="200" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.trainingResult" type="textarea" :rows="1" placeholder="请输入培训结果"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="remark" label="备注" width="200" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.remark" type="textarea" :rows="1" placeholder="请输入备注"></el-input>
                    </template>
                  </el-table-column>
                </el-table>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <!-- 借用记录 -->
        <el-tab-pane label="借用记录" name="borrowRecord">
          <el-form ref="form" :model="form" label-width="120px">
            <!-- 明细表格 -->
            <el-row :gutter="20">
              <el-col :span="24">
                <el-table
                  :data="form.borrowRecordList"
                  border
                  class="contract-detail-table"
                  style="width: 100%"
                  :header-cell-style="{ background: '#f5f7fa', color: '#606266' }">
                  <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
                  <el-table-column prop="borrowCode" label="借用编码" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.borrowCode" placeholder="请输入借用编码"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="archiveCode" label="当前设备档案编码" width="180" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.archiveCode" placeholder="请输入当前设备档案编码"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="borrowDate" label="借用日期" width="150" align="center">
                    <template slot-scope="scope">
                      <el-date-picker v-model="scope.row.borrowDate" type="date" style="width:100%" placeholder="请选择借用日期"></el-date-picker>
                    </template>
                  </el-table-column>
                  <el-table-column prop="borrower" label="借用人" width="150" align="center">
                    <template slot-scope="scope">
                      <el-select v-model="scope.row.borrower" style="width:100%" placeholder="请选择借用人" filterable>
                        <el-option
                          v-for="user in userOptions"
                          :key="user.id"
                          :label="user.name"
                          :value="user.id">
                        </el-option>
                      </el-select>
                    </template>
                  </el-table-column>
                  <el-table-column prop="borrowDepartment" label="借用科室" width="150" align="center">
                    <template slot-scope="scope">
                      <el-select v-model="scope.row.borrowDepartment" style="width:100%" placeholder="请选择借用科室" filterable>
                        <el-option
                          v-for="dept in departmentOptions"
                          :key="dept.id"
                          :label="dept.name"
                          :value="dept.id">
                        </el-option>
                      </el-select>
                    </template>
                  </el-table-column>
                  <el-table-column prop="returnDate" label="归还日期" width="150" align="center">
                    <template slot-scope="scope">
                      <el-date-picker v-model="scope.row.returnDate" type="date" style="width:100%" placeholder="请选择归还日期"></el-date-picker>
                    </template>
                  </el-table-column>
                  <el-table-column prop="borrowPurpose" label="借用用途" width="200" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.borrowPurpose" type="textarea" :rows="1" placeholder="请输入借用用途"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="borrowStatus" label="借用状态" width="150" align="center">
                    <template slot-scope="scope">
                      <el-select v-model="scope.row.borrowStatus" style="width:100%" placeholder="请选择借用状态">
                        <el-option label="借用中" value="借用中"></el-option>
                        <el-option label="已归还" value="已归还"></el-option>
                        <el-option label="逾期未还" value="逾期未还"></el-option>
                      </el-select>
                    </template>
                  </el-table-column>
                  <el-table-column prop="remark" label="备注" width="200" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.remark" type="textarea" :rows="1" placeholder="请输入备注"></el-input>
                    </template>
                  </el-table-column>
                </el-table>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <!-- 不良事件 -->
        <el-tab-pane label="不良事件" name="adverseEvent">
          <el-form ref="form" :model="form" label-width="120px">
            <!-- 明细表格 -->
            <el-row :gutter="20">
              <el-col :span="24">
                <el-table
                  :data="form.adverseEventList"
                  border
                  class="contract-detail-table"
                  style="width: 100%"
                  :header-cell-style="{ background: '#f5f7fa', color: '#606266' }">
                  <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
                  <el-table-column prop="eventCode" label="事件编码" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.eventCode" placeholder="请输入事件编码"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="archiveCode" label="当前设备档案编码" width="180" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.archiveCode" placeholder="请输入当前设备档案编码"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="eventDate" label="事件日期" width="150" align="center">
                    <template slot-scope="scope">
                      <el-date-picker v-model="scope.row.eventDate" type="date" style="width:100%" placeholder="请选择事件日期"></el-date-picker>
                    </template>
                  </el-table-column>
                  <el-table-column prop="reporter" label="报告人" width="150" align="center">
                    <template slot-scope="scope">
                      <el-select v-model="scope.row.reporter" style="width:100%" placeholder="请选择报告人" filterable>
                        <el-option
                          v-for="user in userOptions"
                          :key="user.id"
                          :label="user.name"
                          :value="user.id">
                        </el-option>
                      </el-select>
                    </template>
                  </el-table-column>
                  <el-table-column prop="eventType" label="事件类型" width="150" align="center">
                    <template slot-scope="scope">
                      <el-select v-model="scope.row.eventType" style="width:100%" placeholder="请选择事件类型">
                        <el-option label="设备故障" value="设备故障"></el-option>
                        <el-option label="操作失误" value="操作失误"></el-option>
                        <el-option label="安全隐患" value="安全隐患"></el-option>
                        <el-option label="其他" value="其他"></el-option>
                      </el-select>
                    </template>
                  </el-table-column>
                  <el-table-column prop="eventDescription" label="事件描述" width="200" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.eventDescription" type="textarea" :rows="1" placeholder="请输入事件描述"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="eventLevel" label="事件等级" width="150" align="center">
                    <template slot-scope="scope">
                      <el-select v-model="scope.row.eventLevel" style="width:100%" placeholder="请选择事件等级">
                        <el-option label="一般" value="一般"></el-option>
                        <el-option label="严重" value="严重"></el-option>
                        <el-option label="重大" value="重大"></el-option>
                      </el-select>
                    </template>
                  </el-table-column>
                  <el-table-column prop="handlingMeasures" label="处理措施" width="200" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.handlingMeasures" type="textarea" :rows="1" placeholder="请输入处理措施"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="handlingResult" label="处理结果" width="200" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.handlingResult" type="textarea" :rows="1" placeholder="请输入处理结果"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="remark" label="备注" width="200" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.remark" type="textarea" :rows="1" placeholder="请输入备注"></el-input>
                    </template>
                  </el-table-column>
                </el-table>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <!-- 设备操作员 -->
        <el-tab-pane label="设备操作员" name="deviceOperator">
          <el-form ref="form" :model="form" label-width="120px">
            <!-- 操作员明细表格 -->
            <el-row :gutter="20">
              <el-col :span="24">
                <el-table
                  :data="form.deviceOperatorList"
                  border
                  class="contract-detail-table"
                  style="width: 100%; margin-bottom: 20px;"
                  :header-cell-style="{ background: '#f5f7fa', color: '#606266' }">
                  <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
                  <el-table-column prop="registrationDate" label="登记日期" width="150" align="center">
                    <template slot-scope="scope">
                      <el-date-picker v-model="scope.row.registrationDate" type="date" style="width:100%" placeholder="请选择登记日期"></el-date-picker>
                    </template>
                  </el-table-column>
                  <el-table-column prop="operatorCode" label="操作员编码" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.operatorCode" placeholder="请输入操作员编码"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="operatorName" label="操作员姓名" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.operatorName" placeholder="请输入操作员姓名"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="gender" label="性别" width="120" align="center">
                    <template slot-scope="scope">
                      <el-select v-model="scope.row.gender" style="width:100%" placeholder="请选择性别">
                        <el-option label="男" value="男"></el-option>
                        <el-option label="女" value="女"></el-option>
                      </el-select>
                    </template>
                  </el-table-column>
                  <el-table-column prop="birthDate" label="出生日期" width="150" align="center">
                    <template slot-scope="scope">
                      <el-date-picker v-model="scope.row.birthDate" type="date" style="width:100%" placeholder="请选择出生日期"></el-date-picker>
                    </template>
                  </el-table-column>
                  <el-table-column prop="idCard" label="身份证号" width="180" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.idCard" placeholder="请输入身份证号"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="phone" label="电话" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.phone" placeholder="请输入电话"></el-input>
                    </template>
                  </el-table-column>
                </el-table>
              </el-col>
            </el-row>

            <!-- 证件明细表格 -->
            <el-row :gutter="20">
              <el-col :span="24">
                <el-table
                  :data="form.operatorCertificateList"
                  border
                  class="contract-detail-table"
                  style="width: 100%"
                  :header-cell-style="{ background: '#f5f7fa', color: '#606266' }">
                  <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
                  <el-table-column prop="certificateType" label="证件类型" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.certificateType" placeholder="请输入证件类型"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="projectName" label="项目名称" width="200" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.projectName" placeholder="请输入项目名称"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="content" label="内容" width="300" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.content" type="textarea" :rows="1" placeholder="请输入内容"></el-input>
                    </template>
                  </el-table-column>
                </el-table>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>
      </el-tabs>
        <div class="dialog-footer-center">
          <el-button @click="cancel">取 消</el-button>
          <el-button type="primary" @click="submitForm">保 存</el-button>
        </div>
      </div>
    </div>

    <!-- 查看详情对话框 -->
    <div v-if="viewOpen" class="local-modal-mask">
      <div class="local-modal-content">
        <div class="modal-header-fixed">
          <div style="font-size:18px;font-weight:bold;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;">
            <span>查看设备信息详情{{ getViewDetailTitleSuffix() }}</span>
            <el-button type="text" @click="viewOpen = false" style="font-size:14px;padding:0;color:#909399;">关闭</el-button>
          </div>
        </div>
        <el-tabs v-model="activeTab" class="equipment-tabs">
        <!-- 基本信息 -->
        <el-tab-pane label="基本信息" name="basic">
          <el-form ref="viewForm" :model="form" label-width="120px">
            <!-- 第一行 -->
            <el-row :gutter="20">
              <el-col :span="4">
                <el-form-item label="档案编码：">
                  <el-input v-model="form.assetCode" :disabled="true"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="档案名称：">
                  <el-input v-model="form.assetName" :disabled="true"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="规格：">
                  <el-input v-model="form.specification" :disabled="true"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="型号：">
                  <el-input v-model="form.model" :disabled="true"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="仓库：">
                  <el-select
                    v-model="form.hospitalCode"
                    style="width:100%"
                    :disabled="true">
                    <el-option
                      v-for="item in warehouseOptions"
                      :key="item.id"
                      :label="item.name"
                      :value="item.id">
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="价格/元：">
                  <el-input v-model="form.barcode" :disabled="true"></el-input>
                </el-form-item>
              </el-col>
            </el-row>

            <!-- 第二行 -->
            <el-row :gutter="20">
              <el-col :span="4">
                <el-form-item label="辅助分类：">
                  <el-select v-model="form.auxiliaryCategory" style="width:100%" :disabled="true">
                    <el-option label="分类1" value="1"></el-option>
                    <el-option label="分类2" value="2"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="资产状态：">
                  <el-select v-model="form.assetStatus" placeholder="请选择资产状态" style="width:100%" :disabled="true">
                    <el-option label="正常使用" value="正常使用"></el-option>
                    <el-option label="待维修" value="待维修"></el-option>
                    <el-option label="待拆分" value="待拆分"></el-option>
                    <el-option label="报废" value="报废"></el-option>
                    <el-option label="待报废" value="待报废"></el-option>
                    <el-option label="已损坏" value="已损坏"></el-option>
                    <el-option label="待报废使用中" value="待报废使用中"></el-option>
                    <el-option label="待报废未使用" value="待报废未使用"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="财务分类：">
                  <el-select v-model="form.financialCategory" style="width:100%" :disabled="true">
                    <el-option label="分类1" value="1"></el-option>
                    <el-option label="分类2" value="2"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="财务编号：">
                  <el-input v-model="form.financialCode" :disabled="true"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="品牌：">
                  <el-input v-model="form.brand" :disabled="true"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="产地：">
                  <el-input v-model="form.origin" :disabled="true"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="供应商：">
                  <el-input v-model="form.supplier" :disabled="true"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="生产厂家：">
                  <el-input v-model="form.factoryId" :disabled="true"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="卡片编号：">
                  <el-input v-model="form.barcode" :disabled="true"></el-input>
                </el-form-item>
              </el-col>
            </el-row>

            <!-- 第三行 -->
            <el-row :gutter="20">
              <el-col :span="4">
                <el-form-item label="国别：">
                  <el-input v-model="form.country" :disabled="true"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="单位：">
                  <el-select
                    v-model="form.unit"
                    placeholder="请选择单位"
                    style="width:100%"
                    :disabled="true">
                    <el-option
                      v-for="item in unitOptions"
                      :key="item.id"
                      :label="item.name"
                      :value="item.name">
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="保修类型：">
                  <el-select v-model="form.archiveCode" placeholder="请选择保修类型" style="width:100%" :disabled="true">
                    <el-option label="保内" value="保内"></el-option>
                    <el-option label="保外" value="保外"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="资产序列号：">
                  <el-input v-model="form.serialNumber" :disabled="true"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="资产负责人：">
                  <el-select
                    v-model="form.assetManager"
                    placeholder="请选择资产负责人"
                    style="width:100%"
                    :disabled="true">
                    <el-option
                      v-for="item in userOptions"
                      :key="item.id"
                      :label="item.name"
                      :value="item.name">
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="维修负责人：">
                  <el-select
                    v-model="form.maintenanceManager"
                    placeholder="请选择维修负责人"
                    style="width:100%"
                    :disabled="true">
                    <el-option
                      v-for="item in userOptions"
                      :key="item.id"
                      :label="item.name"
                      :value="item.name">
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <!-- 第四行 -->
            <el-row :gutter="20">
              <el-col :span="4" v-if="switchValue === '全部'">
                <el-form-item label="使用科室：">
                  <el-select v-model="form.useDepartment" style="width:100%" :disabled="true">
                    <el-option
                      v-for="item in departmentOptions"
                      :key="item.id"
                      :label="item.name"
                      :value="item.id">
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="4" v-if="switchValue === '全部'">
                <el-form-item label="管理科室：">
                  <el-select v-model="form.manageDepartment" style="width:100%" :disabled="true">
                    <el-option
                      v-for="item in departmentOptions"
                      :key="item.id"
                      :label="item.name"
                      :value="item.id">
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="存放地点：">
                  <el-input v-model="form.storageLocation" :disabled="true"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="所属分类：">
                  <el-select
                    v-model="form.assetType"
                    placeholder="请选择所属分类"
                    style="width:100%"
                    :disabled="true"
                    filterable
                    :filter-method="filterAssetCategory">
                    <el-option
                      v-for="item in filteredAssetCategoryOptions"
                      :key="item.id"
                      :label="item.name"
                      :value="item.name">
                      <span style="float: left">{{ item.name }}</span>
                      <span v-if="item.code" style="float: right; color: #8492a6; font-size: 13px">{{ item.code }}</span>
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="出厂编号：">
                  <el-input v-model="form.factoryNumber" :disabled="true"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="出厂日期：">
                  <el-date-picker v-model="form.productionDate" type="date" style="width:100%" :disabled="true"></el-date-picker>
                </el-form-item>
              </el-col>
            </el-row>

            <!-- 第五行 -->
            <el-row :gutter="20">
              <el-col :span="4">
                <el-form-item label="注册证件号：">
                  <el-input v-model="form.registrationNumber" :disabled="true"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="预计开机工作日：">
                  <el-date-picker v-model="form.expectedOperationDate" type="date" style="width:100%" :disabled="true"></el-date-picker>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="资金来源：">
                  <el-select v-model="form.fundSource" style="width:100%" :disabled="true">
                    <el-option label="来源1" value="1"></el-option>
                    <el-option label="来源2" value="2"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="发票编号：">
                  <el-input v-model="form.invoiceNumber" :disabled="true"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="发票金额：">
                  <el-input-number v-model="form.invoiceAmount" style="width:100%" :disabled="true"></el-input-number>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="附资产标志：">
                  <el-select v-model="form.attachedAssetFlag" style="width:100%" :disabled="true">
                    <el-option label="是" value="1"></el-option>
                    <el-option label="否" value="0"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <!-- 第六行 -->
            <el-row :gutter="20">
              <el-col :span="4">
                <el-form-item label="设备功率：">
                  <el-input v-model="form.power" :disabled="true"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="理论开机时间：">
                  <el-input-number v-model="form.theoryOperationTime" style="width:100%" :disabled="true"></el-input-number>
                  <span style="margin-left:10px">h/天</span>
                </el-form-item>
              </el-col>
            </el-row>

            <!-- 第七行 -->
            <el-row :gutter="20">
              <el-col :span="4">
                <el-form-item label="录入人：">
                  <el-input v-model="form.creator" :disabled="true"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="录入日期：">
                  <el-date-picker v-model="form.createTime" type="datetime" style="width:100%" :disabled="true"></el-date-picker>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="最后修改人：">
                  <el-input v-model="form.modifier" :disabled="true"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="最后修改时间：">
                  <el-date-picker v-model="form.modifyTime" type="datetime" style="width:100%" :disabled="true"></el-date-picker>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="档案使用情况：">
                  <el-select v-model="form.archiveUsage" style="width:100%" :disabled="true">
                    <el-option label="是" value="1"></el-option>
                    <el-option label="否" value="0"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <!-- 第八行 -->
            <el-row :gutter="20">
              <el-col :span="4">
                <el-form-item label="合同与清单是否一致：">
                  <el-select v-model="form.contractConsistent" style="width:100%" :disabled="true">
                    <el-option label="是" value="1"></el-option>
                    <el-option label="否" value="0"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="是否专网资产：">
                  <el-select v-model="form.specialNetworkAsset" style="width:100%" :disabled="true">
                    <el-option label="是" value="1"></el-option>
                    <el-option label="否" value="0"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="楼宇：">
                  <el-input v-model="form.building" :disabled="true"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="楼层：">
                  <el-input v-model="form.floor" :disabled="true"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="数量：">
                  <el-input-number v-model="form.quantity" style="width:100%" :disabled="true"></el-input-number>
                </el-form-item>
              </el-col>
            </el-row>

            <!-- 第九行 -->
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="备注：">
                  <el-input v-model="form.remark" type="textarea" :disabled="true"></el-input>
                </el-form-item>
              </el-col>
            </el-row>

            <!-- 附属资料容器 -->
            <el-row :gutter="20">
              <el-col :span="24">
                <div class="random-materials-container">
                  <div class="container-title">附属资料</div>
                  <div class="container-content">
                    <el-form-item prop="attachedMaterialsList" label-width="0">
                  <el-checkbox-group v-model="form.attachedMaterialsList" :disabled="true">
                    <el-checkbox label="说明书"></el-checkbox>
                    <el-checkbox label="保修卡"></el-checkbox>
                    <el-checkbox label="合格证"></el-checkbox>
                    <el-checkbox label="检验报告书"></el-checkbox>
                    <el-checkbox label="报关单"></el-checkbox>
                  </el-checkbox-group>
                </el-form-item>
                  </div>
                </div>
              </el-col>
            </el-row>

            <!-- 第二个容器 -->
            <el-row :gutter="20">
              <el-col :span="24">
                <div class="additional-container">
                  <div class="container-title">附加信息</div>
                  <div class="container-content">
                    <el-form-item prop="additionalInfoList" label-width="0">
                      <el-checkbox-group v-model="form.additionalInfoList" :disabled="true">
                        <el-checkbox label="急救/生命支持"></el-checkbox>
                        <el-checkbox label="特种设备"></el-checkbox>
                        <el-checkbox label="计量设备"></el-checkbox>
                        <el-checkbox label="效益分析"></el-checkbox>
                        <el-checkbox label="科研/科教"></el-checkbox>
                        <el-checkbox label="大型设备"></el-checkbox>
                        <el-checkbox label="中大型设备"></el-checkbox>
                        <el-checkbox label="中小型设备"></el-checkbox>
                        <el-checkbox label="中型设备"></el-checkbox>
                        <el-checkbox label="小型设备"></el-checkbox>
                        <el-checkbox label="公用设备"></el-checkbox>
                        <el-checkbox label="灭菌类"></el-checkbox>
                        <el-checkbox label="重点医学装备"></el-checkbox>
                        <el-checkbox label="压力容器类"></el-checkbox>
                      </el-checkbox-group>
                    </el-form-item>
                  </div>
                </div>
              </el-col>
            </el-row>

            <!-- 第十行 -->
            <el-row :gutter="20">
            </el-row>
          </el-form>
        </el-tab-pane>

        <!-- 资产卡片 -->
        <el-tab-pane label="资产卡片" name="assetCard">
          <div class="asset-card-container">
            <div class="asset-card" v-if="form.assetCode">
              <!-- 卡片标题 -->
              <div class="asset-card-title">{{ hospitalName || '医院' }}固定资产</div>

              <!-- 卡片内容 -->
              <div class="asset-card-content">
                <!-- 左侧信息区域 -->
                <div class="asset-card-info">
                  <div class="asset-card-row">
                    <div class="asset-card-label">使用科室：</div>
                    <div class="asset-card-value">{{ getDepartmentName(form.useDepartment) || '--' }}</div>
                  </div>
                  <div class="asset-card-row">
                    <div class="asset-card-label">资产名称：</div>
                    <div class="asset-card-value">{{ form.assetName || '--' }}</div>
                  </div>
                  <div class="asset-card-row">
                    <div class="asset-card-label">卡片编号：</div>
                    <div class="asset-card-value">{{ form.barcode || '--' }}</div>
                  </div>
                  <div class="asset-card-row">
                    <div class="asset-card-label">原值(元)：</div>
                    <div class="asset-card-value">{{ form.originalPrice ? parseFloat(form.originalPrice).toFixed(2) : '--' }}</div>
                  </div>
                  <div class="asset-card-row">
                    <div class="asset-card-label">规格型号：</div>
                    <div class="asset-card-value">{{ (form.specification || '') + (form.model ? '/' + form.model : '') || '--' }}</div>
                  </div>
                  <div class="asset-card-row">
                    <div class="asset-card-label">购置日期：</div>
                    <div class="asset-card-value">{{ form.purchaseDate || '--' }}</div>
                  </div>
                  <div class="asset-card-row">
                    <div class="asset-card-label">管理部门：</div>
                    <div class="asset-card-value">{{ getDepartmentName(form.manageDepartment) || '--' }}</div>
                  </div>
                  <div class="asset-card-row">
                    <div class="asset-card-label">存放地点：</div>
                    <div class="asset-card-value">{{ form.storageLocation || '--' }}</div>
                  </div>
                </div>

                <!-- 右侧二维码区域 -->
                <div class="asset-card-qrcode">
                  <img
                    v-if="form.assetCode"
                    :src="getQRCodeUrl(form.assetCode)"
                    alt="二维码"
                    class="qrcode-image"
                  />
                </div>
              </div>
            </div>
            <div v-else class="asset-card-empty">
              <p>暂无数据</p>
            </div>
          </div>
        </el-tab-pane>

        <!-- 合同信息 -->
        <el-tab-pane label="合同信息" name="contract">
          <el-form ref="viewForm" :model="form" label-width="120px">
            <!-- 维护条件容器 -->
            <el-row :gutter="20">
              <el-col :span="24">
                <div class="maintenance-container">
                  <div class="container-title">维护条件</div>
                  <div class="container-content">
                    <el-row :gutter="20">
                      <el-col :span="6">
                <el-form-item label="合同名称：">
                  <el-input v-model="form.contractName" :disabled="true"></el-input>
                </el-form-item>
                      </el-col>
                      <el-col :span="6">
                <el-form-item label="合同价格：">
                  <el-input-number v-model="form.contractPrice" style="width:100%" :disabled="true"></el-input-number>
                </el-form-item>
                      </el-col>
                      <el-col :span="6">
                <el-form-item label="签订日期：">
                  <el-date-picker v-model="form.signDate" type="date" style="width:100%" :disabled="true"></el-date-picker>
                </el-form-item>
                      </el-col>
                      <el-col :span="6">
                <el-form-item label="购入日期：">
                  <el-date-picker v-model="form.purchaseDate" type="date" style="width:100%" :disabled="true"></el-date-picker>
                </el-form-item>
                      </el-col>
                    </el-row>
                    <el-row :gutter="20">
                      <el-col :span="6">
                <el-form-item label="验收合格日期：">
                  <el-date-picker v-model="form.acceptanceDate" type="date" style="width:100%" :disabled="true"></el-date-picker>
                </el-form-item>
                      </el-col>
                      <el-col :span="6">
                <el-form-item label="送审时间：">
                  <el-date-picker v-model="form.reviewTime" type="datetime" style="width:100%" :disabled="true"></el-date-picker>
                </el-form-item>
              </el-col>
                      <el-col :span="6">
                <el-form-item label="中标日期：">
                  <el-date-picker v-model="form.bidDate" type="date" style="width:100%" :disabled="true"></el-date-picker>
                </el-form-item>
                      </el-col>
                      <el-col :span="6">
                <el-form-item label="通知供货时间：">
                  <el-date-picker v-model="form.supplyNoticeDate" type="date" style="width:100%" :disabled="true"></el-date-picker>
                </el-form-item>
                      </el-col>
                    </el-row>
                    <el-row :gutter="20">
                      <el-col :span="6">
                <el-form-item label="首次验收日期：">
                  <el-date-picker v-model="form.firstAcceptanceDate" type="date" style="width:100%" :disabled="true"></el-date-picker>
                </el-form-item>
                      </el-col>
                      <el-col :span="6">
                <el-form-item label="交货截止日期：">
                  <el-date-picker v-model="form.deliveryDeadline" type="date" style="width:100%" :disabled="true"></el-date-picker>
                </el-form-item>
                      </el-col>
                      <el-col :span="6">
                <el-form-item label="二次验收日期：">
                  <el-date-picker v-model="form.secondAcceptanceDate" type="date" style="width:100%" :disabled="true"></el-date-picker>
                </el-form-item>
                      </el-col>
                      <el-col :span="6">
                        <el-form-item label="保修到期：">
                          <el-date-picker v-model="form.warrantyExpireDate" type="date" style="width:100%" :disabled="true"></el-date-picker>
                        </el-form-item>
                      </el-col>
                    </el-row>
                    <el-row :gutter="20">
                      <el-col :span="6">
                <el-form-item label="出保日期：">
                  <el-date-picker v-model="form.warrantyOutDate" type="date" style="width:100%" :disabled="true"></el-date-picker>
                </el-form-item>
                      </el-col>
                    </el-row>
                  </div>
                </div>
              </el-col>
            </el-row>

            <!-- 明细表格 -->
            <el-row :gutter="20">
              <el-col :span="24">
                <el-table
                  :data="form.contractDetailList"
                  border
                  class="contract-detail-table"
                  style="width: 100%"
                  :header-cell-style="{ background: '#f5f7fa', color: '#606266' }">
                  <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
                  <el-table-column prop="contractType" label="合同类型" width="120" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.contractType || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="contractCode" label="合同编号" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.contractCode || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="contractName" label="合同名称" width="180" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.contractName || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="contractPartyA" label="合同甲方" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.contractPartyA || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="signer" label="签约人" width="120" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.signer || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="signDate" label="日期" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.signDate || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="maintenanceDate" label="维保日期" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.maintenanceDate || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="contractAmount" label="合同金额" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.contractAmount || 0 }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="maintenanceCompany" label="维修公司" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.maintenanceCompany || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="maintenancePhone" label="维修电话" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.maintenancePhone || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="projectNumber" label="立项编号" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.projectNumber || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="purchaseMethod" label="采购方式" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.purchaseMethod || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="fundSource" label="资金来源" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.fundSource || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="remark" label="备注" width="200" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <span>{{ scope.row.remark || '' }}</span>
                    </template>
                  </el-table-column>
                </el-table>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <!-- 文档管理 -->
        <el-tab-pane label="文档管理" name="manufacturer">
          <div class="document-management-container">
            <!-- 顶部工具栏 -->
            <div class="document-toolbar">
              <el-input
                v-model="documentSearchName"
                placeholder="文档名称"
                style="width: 200px; margin-right: 10px;"
                clearable
                @keyup.enter.native="handleDocumentSearch"
              >
                <el-button slot="append" icon="el-icon-search" @click="handleDocumentSearch"></el-button>
              </el-input>
              <el-button type="primary" icon="el-icon-folder-opened" @click="handleSelectFile">1选择文件</el-button>
              <el-button type="primary" icon="el-icon-upload2" @click="handleDocumentUpload">2上传</el-button>
              <el-button type="warning" icon="el-icon-download" @click="handleDocumentDownload" :disabled="documentSelectedFiles.length === 0">选中下载</el-button>
              <el-button type="warning" @click="handleDocumentCopy" :disabled="documentSelectedFiles.length === 0">选中复制到...</el-button>
              <el-button type="danger" icon="el-icon-delete" @click="handleDocumentDelete" :disabled="documentSelectedFiles.length === 0">选中删除</el-button>
              <el-button type="success" icon="el-icon-view" @click="handleDocumentPreview" :disabled="documentSelectedFiles.length !== 1">Q预览图片</el-button>
            </div>

            <!-- 主内容区域 -->
            <div class="document-content">
              <!-- 左侧文件类型 -->
              <div class="document-file-type-box">
                <div class="file-list-header">
                  <span>文件类型</span>
                </div>
                <div class="file-type-content">
                  <el-radio-group v-model="selectedDocumentType" size="small">
                    <div class="file-type-item-row">
                      <el-radio
                        v-for="(type, index) in filteredDocumentTypeList"
                        :key="type.value"
                        :label="type.value"
                        class="file-type-radio"
                      >{{ type.label }}</el-radio>
                    </div>
                  </el-radio-group>
                </div>
              </div>

              <!-- 中间文件列表 -->
              <div class="document-file-list-box">
                <div class="file-list-header">
                  <span>文件列表</span>
                </div>
                <div class="file-list-content">
                  <div
                    v-for="file in filteredDocumentList"
                    :key="file.id"
                    class="file-list-item"
                    :class="{ 'active': previewFile && previewFile.id === file.id, 'selected': isFileSelected(file) }"
                    @click="handleFileItemClick(file)"
                  >
                    <i :class="getFileIcon(file)" style="margin-right: 8px;"></i>
                    <span class="file-list-name" :title="file.name">{{ file.name }}</span>
                  </div>
                  <div v-if="filteredDocumentList.length === 0" class="file-list-empty">
                    暂无文件
                  </div>
                </div>
              </div>

              <!-- 右侧文件预览框 -->
              <div class="image-preview-box">
                <div class="preview-box-header">
                  <span>文件预览</span>
                </div>
                <div class="preview-box-content">
                  <div v-if="previewFile" class="preview-image-wrapper">
                    <img v-if="isImageFile(previewFile)" :src="previewFile.url" alt="预览" class="preview-image-full" @dblclick="handleImageDoubleClick" />
                    <iframe v-else-if="isPdfFile(previewFile)" :src="previewFile.url" class="preview-pdf-iframe" frameborder="0"></iframe>
                    <div v-else class="preview-file-info">
                      <i class="el-icon-document" style="font-size: 48px; color: #909399; margin-bottom: 10px;"></i>
                      <div class="preview-file-name">{{ previewFile.name }}</div>
                      <div class="preview-file-type">{{ getDocumentTypeLabel(previewFile.type) || '未知类型' }}</div>
                    </div>
                  </div>
                  <div v-else class="preview-placeholder-box">
                    <div class="preview-placeholder-text">请从列表中选择文件进行预览</div>
                  </div>
                </div>
              </div>

              <!-- 图片查看对话框 -->
              <el-dialog
                title="图片查看"
                :visible.sync="imageViewerVisible"
                width="90%"
                :before-close="handleImageViewerClose"
                custom-class="image-viewer-dialog"
              >
                <div class="image-viewer-container" @wheel.prevent="handleImageWheel">
                  <img
                    ref="viewerImage"
                    :src="viewerImageUrl"
                    alt="查看图片"
                    class="viewer-image"
                    :style="{ transform: `scale(${imageScale})`, transformOrigin: 'center center' }"
                    @mousedown="handleImageMouseDown"
                    @mousemove="handleImageMouseMove"
                    @mouseup="handleImageMouseUp"
                    @mouseleave="handleImageMouseUp"
                  />
                </div>
                <div slot="footer" class="dialog-footer">
                  <el-button @click="resetImageScale">重置</el-button>
                  <el-button @click="zoomOut">缩小</el-button>
                  <el-button @click="zoomIn">放大</el-button>
                  <span class="scale-info">缩放比例: {{ Math.round(imageScale * 100) }}%</span>
                </div>
              </el-dialog>
            </div>
          </div>
        </el-tab-pane>


        <!-- 附属配件 -->
        <el-tab-pane label="附属配件" name="bidding">
          <el-form ref="viewForm" :model="form" label-width="120px">
            <!-- 明细表格 -->
            <el-row :gutter="20">
              <el-col :span="24">
                <el-table
                  :data="form.accessoryDetailList"
                  border
                  class="contract-detail-table"
                  style="width: 100%"
                  :header-cell-style="{ background: '#f5f7fa', color: '#606266' }">
                  <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
                  <el-table-column prop="barcode" label="住条码" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.barcode || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="accessoryName" label="配件名称" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.accessoryName || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="accessoryCode" label="配件编号" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.accessoryCode || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="accessorySerialNumber" label="配件序列号" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.accessorySerialNumber || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="accessorySpecification" label="配件规格型号" width="180" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.accessorySpecification || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="quantity" label="数量" width="120" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.quantity || 0 }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="unitPrice" label="单价" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.unitPrice || 0 }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="totalValue" label="总价值" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.totalValue || 0 }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="useStatus" label="使用状态" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.useStatus || '' }}</span>
                    </template>
                  </el-table-column>
                </el-table>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <!-- 转移记录 -->
        <el-tab-pane label="转移记录" name="transferRecord">
          <el-form ref="viewForm" :model="form" label-width="120px">
            <!-- 明细表格 -->
            <el-row :gutter="20">
              <el-col :span="24">
                <el-table
                  :data="form.transferRecordList"
                  border
                  class="contract-detail-table"
                  style="width: 100%"
                  :header-cell-style="{ background: '#f5f7fa', color: '#606266' }">
                  <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
                  <el-table-column prop="deviceBarcode" label="设备条形码" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.deviceBarcode || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="changeCount" label="变动次数" width="120" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.changeCount || 0 }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="approvalNumber" label="审批单号" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.approvalNumber || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="deviceName" label="设备名称" width="180" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.deviceName || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="originalDepartment" label="原科室" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ getDepartmentName(scope.row.originalDepartment) || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="newDepartment" label="新科室" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ getDepartmentName(scope.row.newDepartment) || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="applicant" label="申请人" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ getUserName(scope.row.applicant) || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="applicationDate" label="申请日期" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.applicationDate || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="changeReason" label="变动原因" width="200" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <span>{{ scope.row.changeReason || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="auditor" label="审核人" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ getUserName(scope.row.auditor) || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="auditDate" label="审核日期" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.auditDate || '' }}</span>
                    </template>
                  </el-table-column>
                </el-table>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <!-- 维修档案 -->
        <el-tab-pane label="维修档案" name="maintenanceRecord">
          <el-form ref="viewForm" :model="form" label-width="120px">
            <!-- 明细表格 -->
            <el-row :gutter="20">
              <el-col :span="24">
                <el-table
                  :data="form.maintenanceRecordList"
                  border
                  class="contract-detail-table"
                  style="width: 100%"
                  :header-cell-style="{ background: '#f5f7fa', color: '#606266' }">
                  <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
                  <el-table-column prop="maintenanceStatus" label="维修状态" width="120" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.maintenanceStatus || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="maintenanceOrderNumber" label="维修单号" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.maintenanceOrderNumber || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="deviceName" label="设备名称" width="180" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.deviceName || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="department" label="所在科室" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ getDepartmentName(scope.row.department) || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="maintenanceDate" label="维修日期" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.maintenanceDate || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="warrantyPeriod" label="保修期限" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.warrantyPeriod || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="warrantyContent" label="保修内容" width="200" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <span>{{ scope.row.warrantyContent || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="maintenanceEngineer" label="维修工程师" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.maintenanceEngineer || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="maintenanceCost" label="维修费用" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.maintenanceCost || 0 }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="workHours" label="工时" width="120" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.workHours || 0 }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="warrantyPerson" label="保修人" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.warrantyPerson || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="warrantyTime" label="保修时间" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.warrantyTime || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="faultDescription" label="故障描述" width="200" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <span>{{ scope.row.faultDescription || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="maintenanceResult" label="维修结果" width="200" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <span>{{ scope.row.maintenanceResult || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="accessoryAmount" label="配件金额" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.accessoryAmount || 0 }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="contactPhone" label="联系电话" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.contactPhone || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="remark" label="备注" width="200" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <span>{{ scope.row.remark || '' }}</span>
                    </template>
                  </el-table-column>
                </el-table>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <!-- 同类设备分布 -->
        <el-tab-pane label="同类设备分布" name="similarDevice">
          <el-form ref="viewForm" :model="form" label-width="120px">
            <!-- 明细表格 -->
            <el-row :gutter="20">
              <el-col :span="24">
                <el-table
                  :data="form.similarDeviceList"
                  border
                  class="contract-detail-table"
                  style="width: 100%"
                  :header-cell-style="{ background: '#f5f7fa', color: '#606266' }">
                  <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
                  <el-table-column prop="useStatus" label="使用状态" width="120" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.useStatus || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="archiveCode" label="设备档案号" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.archiveCode || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="deviceName" label="设备名称" width="180" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.deviceName || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="specification" label="规格" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.specification || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="model" label="型号" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.model || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="enableDate" label="启用日期" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.enableDate || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="unitPrice" label="单价" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.unitPrice || 0 }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="useDepartment" label="使用科室" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ getDepartmentName(scope.row.useDepartment) || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="supplier" label="供货商" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.supplier || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="originalDeviceCode" label="原设备编码" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.originalDeviceCode || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="brand" label="品牌" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.brand || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="serialNumber" label="序列号" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.serialNumber || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="category" label="类别" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.category || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="productionDate" label="出厂日期" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.productionDate || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="financialCode" label="财务编码" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.financialCode || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="factoryCode" label="出厂编码" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.factoryCode || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="maintenanceStatus" label="维保状态" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.maintenanceStatus || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="serviceLife" label="使用年限" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.serviceLife || 0 }}</span>
                    </template>
                  </el-table-column>
                </el-table>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <!-- 巡检记录 -->
        <el-tab-pane label="巡检记录" name="inspectionRecord">
          <el-form ref="viewForm" :model="form" label-width="120px">
            <!-- 明细表格 -->
            <el-row :gutter="20">
              <el-col :span="24">
                <el-table
                  :data="form.inspectionRecordList"
                  border
                  class="contract-detail-table"
                  style="width: 100%"
                  :header-cell-style="{ background: '#f5f7fa', color: '#606266' }">
                  <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
                  <el-table-column prop="inspectionCode" label="巡检编码" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.inspectionCode || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="archiveCode" label="当前设备档案编码" width="180" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.archiveCode || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="inspectionDate" label="巡检日期" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.inspectionDate || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="inspectionPerson" label="巡检人" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ getUserName(scope.row.inspectionPerson) || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="inspectionProject" label="巡检项目" width="200" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <span>{{ scope.row.inspectionProject || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="inspectionProjectDetail" label="巡检项目明细" width="200" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <span>{{ scope.row.inspectionProjectDetail || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="inspectionResult" label="巡检结果" width="200" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <span>{{ scope.row.inspectionResult || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="reasonAnalysis" label="原因分析" width="200" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <span>{{ scope.row.reasonAnalysis || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="improvementMeasures" label="改进措施" width="200" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <span>{{ scope.row.improvementMeasures || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="logisticsImplementation" label="后勤落实情况" width="200" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <span>{{ scope.row.logisticsImplementation || '' }}</span>
                    </template>
                  </el-table-column>
                </el-table>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <!-- 质量检测 -->
        <el-tab-pane label="质量检测" name="qualityTest">
          <el-form ref="viewForm" :model="form" label-width="120px">
            <!-- 明细表格 -->
            <el-row :gutter="20">
              <el-col :span="24">
                <el-table
                  :data="form.qualityTestList"
                  border
                  class="contract-detail-table"
                  style="width: 100%"
                  :header-cell-style="{ background: '#f5f7fa', color: '#606266' }">
                  <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
                  <el-table-column prop="qualityControlNumber" label="质控编号" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.qualityControlNumber || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="archiveCode" label="当前设备档案编码" width="180" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.archiveCode || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="testDate" label="日期" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.testDate || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="qualityControlPerson" label="质控检测人" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ getUserName(scope.row.qualityControlPerson) || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="qualityControlProject" label="质控项目" width="200" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <span>{{ scope.row.qualityControlProject || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="projectReferenceValue" label="项目参考值" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.projectReferenceValue || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="qualityControlResult" label="质控检测结果" width="200" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <span>{{ scope.row.qualityControlResult || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="conclusion" label="结论" width="200" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <span>{{ scope.row.conclusion || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="remark" label="备注" width="200" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <span>{{ scope.row.remark || '' }}</span>
                    </template>
                  </el-table-column>
                </el-table>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <!-- 培训记录 -->
        <el-tab-pane label="培训记录" name="trainingRecord">
          <el-form ref="viewForm" :model="form" label-width="120px">
            <!-- 明细表格 -->
            <el-row :gutter="20">
              <el-col :span="24">
                <el-table
                  :data="form.trainingRecordList"
                  border
                  class="contract-detail-table"
                  style="width: 100%"
                  :header-cell-style="{ background: '#f5f7fa', color: '#606266' }">
                  <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
                  <el-table-column prop="trainingCode" label="培训编码" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.trainingCode || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="archiveCode" label="当前设备档案编码" width="180" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.archiveCode || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="trainingDate" label="培训日期" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.trainingDate || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="trainingPerson" label="培训人" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ getUserName(scope.row.trainingPerson) || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="trainee" label="受训人" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ getUserName(scope.row.trainee) || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="trainingContent" label="培训内容" width="200" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <span>{{ scope.row.trainingContent || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="trainingResult" label="培训结果" width="200" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <span>{{ scope.row.trainingResult || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="remark" label="备注" width="200" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <span>{{ scope.row.remark || '' }}</span>
                    </template>
                  </el-table-column>
                </el-table>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <!-- 借用记录 -->
        <el-tab-pane label="借用记录" name="borrowRecord">
          <el-form ref="viewForm" :model="form" label-width="120px">
            <!-- 明细表格 -->
            <el-row :gutter="20">
              <el-col :span="24">
                <el-table
                  :data="form.borrowRecordList"
                  border
                  class="contract-detail-table"
                  style="width: 100%"
                  :header-cell-style="{ background: '#f5f7fa', color: '#606266' }">
                  <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
                  <el-table-column prop="borrowCode" label="借用编码" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.borrowCode || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="archiveCode" label="当前设备档案编码" width="180" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.archiveCode || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="borrowDate" label="借用日期" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.borrowDate || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="borrower" label="借用人" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ getUserName(scope.row.borrower) || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="borrowDepartment" label="借用科室" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ getDepartmentName(scope.row.borrowDepartment) || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="returnDate" label="归还日期" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.returnDate || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="borrowPurpose" label="借用用途" width="200" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <span>{{ scope.row.borrowPurpose || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="borrowStatus" label="借用状态" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.borrowStatus || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="remark" label="备注" width="200" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <span>{{ scope.row.remark || '' }}</span>
                    </template>
                  </el-table-column>
                </el-table>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <!-- 不良事件 -->
        <el-tab-pane label="不良事件" name="adverseEvent">
          <el-form ref="viewForm" :model="form" label-width="120px">
            <!-- 明细表格 -->
            <el-row :gutter="20">
              <el-col :span="24">
                <el-table
                  :data="form.adverseEventList"
                  border
                  class="contract-detail-table"
                  style="width: 100%"
                  :header-cell-style="{ background: '#f5f7fa', color: '#606266' }">
                  <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
                  <el-table-column prop="eventCode" label="事件编码" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.eventCode || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="archiveCode" label="当前设备档案编码" width="180" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.archiveCode || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="eventDate" label="事件日期" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.eventDate || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="reporter" label="报告人" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ getUserName(scope.row.reporter) || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="eventType" label="事件类型" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.eventType || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="eventDescription" label="事件描述" width="200" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <span>{{ scope.row.eventDescription || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="eventLevel" label="事件等级" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.eventLevel || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="handlingMeasures" label="处理措施" width="200" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <span>{{ scope.row.handlingMeasures || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="handlingResult" label="处理结果" width="200" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <span>{{ scope.row.handlingResult || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="remark" label="备注" width="200" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <span>{{ scope.row.remark || '' }}</span>
                    </template>
                  </el-table-column>
                </el-table>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <!-- 设备操作员 -->
        <el-tab-pane label="设备操作员" name="deviceOperator">
          <el-form ref="viewForm" :model="form" label-width="120px">
            <!-- 操作员明细表格 -->
            <el-row :gutter="20">
              <el-col :span="24">
                <el-table
                  :data="form.deviceOperatorList"
                  border
                  class="contract-detail-table"
                  style="width: 100%; margin-bottom: 20px;"
                  :header-cell-style="{ background: '#f5f7fa', color: '#606266' }">
                  <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
                  <el-table-column prop="registrationDate" label="登记日期" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.registrationDate || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="operatorCode" label="操作员编码" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.operatorCode || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="operatorName" label="操作员姓名" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.operatorName || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="gender" label="性别" width="120" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.gender || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="birthDate" label="出生日期" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.birthDate || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="idCard" label="身份证号" width="180" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.idCard || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="phone" label="电话" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.phone || '' }}</span>
                    </template>
                  </el-table-column>
                </el-table>
              </el-col>
            </el-row>

            <!-- 证件明细表格 -->
            <el-row :gutter="20">
              <el-col :span="24">
                <el-table
                  :data="form.operatorCertificateList"
                  border
                  class="contract-detail-table"
                  style="width: 100%"
                  :header-cell-style="{ background: '#f5f7fa', color: '#606266' }">
                  <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
                  <el-table-column prop="certificateType" label="证件类型" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.certificateType || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="projectName" label="项目名称" width="200" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.projectName || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="content" label="内容" width="300" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <span>{{ scope.row.content || '' }}</span>
                    </template>
                  </el-table-column>
                </el-table>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <!-- 保养记录 -->
        <el-tab-pane label="保养记录" name="careRecord">
          <el-form ref="viewForm" :model="form" label-width="120px">
            <!-- 明细表格 -->
            <el-row :gutter="20">
              <el-col :span="24">
                <el-table
                  :data="form.careRecordList"
                  border
                  class="contract-detail-table"
                  style="width: 100%"
                  :header-cell-style="{ background: '#f5f7fa', color: '#606266' }">
                  <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
                  <el-table-column prop="careLevel" label="保养级别" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.careLevel || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="archiveCode" label="当前设备档案编码" width="180" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.archiveCode || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="careDate" label="保养日期" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.careDate || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="careProject" label="保养项目" width="200" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <span>{{ scope.row.careProject || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="careResult" label="保养结果" width="200" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <span>{{ scope.row.careResult || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="carePerson" label="保养人" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ getUserName(scope.row.carePerson) || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="acceptancePerson" label="验收人" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ getUserName(scope.row.acceptancePerson) || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="acceptanceDate" label="验收日期" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.acceptanceDate || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="careNumber" label="保养编号" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.careNumber || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="remark" label="备注" width="200" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <span>{{ scope.row.remark || '' }}</span>
                    </template>
                  </el-table-column>
                </el-table>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <!-- 计量检测 -->
        <el-tab-pane label="计量检测" name="measurementTest">
          <el-form ref="viewForm" :model="form" label-width="120px">
            <!-- 明细表格 -->
            <el-row :gutter="20">
              <el-col :span="24">
                <el-table
                  :data="form.measurementTestList"
                  border
                  class="contract-detail-table"
                  style="width: 100%"
                  :header-cell-style="{ background: '#f5f7fa', color: '#606266' }">
                  <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
                  <el-table-column prop="archiveCode" label="设备档案号" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.archiveCode || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="deviceName" label="设备名称" width="180" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.deviceName || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="testDate" label="检测时间" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.testDate || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="testInstitution" label="检测机构" width="180" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.testInstitution || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="certificateNumber" label="证书/检验报告编号" width="200" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.certificateNumber || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="testResult" label="检测结果" width="200" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <span>{{ scope.row.testResult || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="testCost" label="检测费用" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.testCost || 0 }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="contactPhone" label="联系电话" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.contactPhone || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="measurementStatus" label="计量状态" width="150" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.measurementStatus || '' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="remark" label="备注" width="200" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <span>{{ scope.row.remark || '' }}</span>
                    </template>
                  </el-table-column>
                </el-table>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>
      </el-tabs>
      </div>
    </div>

    <!-- 资产导入对话框 -->
    <div v-if="upload.open" class="local-modal-mask">
      <div class="local-modal-content" style="width: 500px;">
        <div style="font-size:18px;font-weight:bold;margin-bottom:16px;">{{ upload.title }}</div>
      <el-upload
        ref="upload"
        :limit="1"
        accept=".xlsx, .xls"
        :headers="upload.headers"
        :action="upload.url + '?updateSupport=' + upload.updateSupport"
        :disabled="upload.isUploading"
        :on-progress="handleFileUploadProgress"
        :on-success="handleFileSuccess"
        :auto-upload="false"
        drag
      >
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        <div class="el-upload__tip text-center" slot="tip">
          <div class="el-upload__tip" slot="tip">
            <el-checkbox v-model="upload.updateSupport" /> 是否更新已经存在的资产数据
          </div>
          <span>仅允许导入xls、xlsx格式文件。</span>
          <el-link type="primary" :underline="false" style="font-size:12px;vertical-align: baseline;" @click="importTemplate">下载模板</el-link>
        </div>
      </el-upload>
        <div class="dialog-footer" style="text-align:right;margin-top:16px;">
        <el-button type="primary" @click="submitFileForm">确 定</el-button>
        <el-button @click="upload.open = false">取 消</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { listEquipment, getEquipment, delEquipment, addEquipment, updateEquipment, getEquipmentStatistics, getEquipmentByAssetCode } from "@/api/equipment/equipmentInfo";
import { listEquipmentFile, addEquipmentFile } from "@/api/equipment/equipmentFile";
import { listEquipmentStorage, getEquipmentStorage } from "@/api/equipment/equipmentStorage";
import { connection,connectprinter,printstart,printlabel,previewlabel } from "@/api/rfidPrinter/ZMPrintService";
import { getSbinfo,getSbLabelInfo } from "@/api/sb/sbinfo";
import request from "@/utils/request";
import axios from 'axios';
import { getToken } from "@/utils/auth";
import { treeselect, listCategory68All } from "@/api/foundation/category68";
import { listdepartAll } from "@/api/foundation/depart";
import { listWarehouseAll } from "@/api/foundation/warehouse";
import { listUnitAll } from "@/api/foundation/unit";
import { listUserAll } from "@/api/system/user";
import { listSupplier, listSupplierAll } from "@/api/foundation/supplier";
import { listFactory, listFactoryAll } from "@/api/foundation/factory";
import hospitalNameMixin from '@/mixins/hospitalNameMixin';
import AssetCardPrint from './assetCardPrint.vue';

export default {
  name: "EquipmentInfo",
  mixins: [hospitalNameMixin],
  components: {
    AssetCardPrint
  },
  dicts: ['sys_normal_disable'],
  data() {
    return {
      // 树形数据
      treeData: [],
      treeProps: {
        label: 'category68Name',
        children: 'children'
      },
      // 默认展开的节点keys（根节点）
      defaultExpandedKeys: [],
      // 科室选项列表
      departmentOptions: [],
      // 仓库选项列表（仅设备类型）
      warehouseOptions: [],
      // 单位选项列表
      unitOptions: [],
      // 供应商选项列表
      supplierOptions: [],
      // 生产厂家选项列表
      factoryOptions: [],
      // 用户选项列表
      userOptions: [],
      // 资产分类选项列表（完整列表）
      assetCategoryOptions: [],
      // 资产分类搜索关键词
      assetCategoryKeyword: '',
      // 资产导入参数
      upload: {
        // 是否显示弹出层（资产导入）
        open: false,
        // 弹出层标题（资产导入）
        title: "",
        // 是否禁用上传
        isUploading: false,
        // 是否更新已经存在的资产数据
        updateSupport: 0,
        // 设置上传的请求头部
        headers: { Authorization: "Bearer " + getToken() },
        // 上传的地址
        url: process.env.VUE_APP_BASE_API + "/equipment/info/importData"
      },
      // 图片上传相关
      uploadImageUrl: process.env.VUE_APP_BASE_API + "/common/upload",
      uploadImageHeaders: { Authorization: "Bearer " + getToken() },
      // 设备图片相关
      selectedDeviceImageFile: null,
      deviceImageSelectedIndex: -1,
      deviceImagePreviewVisible: false,
      // 当前查看/编辑的入库明细数据（用于修改时恢复数据）
      currentStorageDetail: null,
      currentStorageDetailKey: null,
      // 遮罩层
      loading: false,
      // 选中数组
      ids: [],
      // 资产卡片打印数据
      printAssetCardData: null,
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 切换按钮值（全部/科室/仓库）
      switchValue: '全部',
      // 总条数
      total: 0,
      // 设备信息表格数据
      equipmentList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 是否显示查看详情弹出层
      viewOpen: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        assetName: null,
        assetCode: null,
        useDepartment: null,
        assetStatus: null,
        beginDate: null,
        endDate: null,
        category68Id: undefined,
        warehouseId: null
      },
      // 当前激活的标签页
      activeTab: 'basic',
      documentActiveTab: 'purchaseApproval',
      // 文档管理相关
      documentSearchName: '',
      documentFileList: [],
      documentSelectedFiles: [],
      selectedDocumentType: '',
      typeListExpanded: true,
      previewFile: null,
      selectedUploadFile: null,
      // 图片查看器相关
      imageViewerVisible: false,
      viewerImageUrl: '',
      imageScale: 1,
      isDragging: false,
      dragStart: { x: 0, y: 0 },
      imagePosition: { x: 0, y: 0 },
      documentTypeList: [
        { label: '合格证', value: 'certificate' },
        { label: '说明书', value: 'manual' },
        { label: '装箱单', value: 'packingList' },
        { label: '配置单', value: 'configList' },
        { label: '操作说明', value: 'operationManual' },
        { label: '安装光盘', value: 'installCD' },
        { label: '报关单', value: 'customsDeclaration' },
        { label: '检验检疫证明', value: 'inspectionQuarantine' },
        { label: '免检证明', value: 'exemptionCertificate' },
        { label: '医疗器械注册证', value: 'medicalDeviceRegistration' },
        { label: '发票', value: 'invoice' },
        { label: '招投标文件(中标通知书)', value: 'biddingDocument' },
        { label: '验收单', value: 'acceptanceForm' },
        { label: '医疗设备培训登记表', value: 'trainingRegistration' },
        { label: '医疗设备购置申请表', value: 'purchaseApplication' },
        { label: '大中型医疗设备购置论证报告', value: 'purchaseJustification' },
        { label: '设备图片', value: 'equipmentImage' },
        { label: '设备铭牌图片', value: 'nameplateImage' },
        { label: '设备安装位置图片', value: 'installationImage' },
        { label: '资产位置房间号图片', value: 'roomNumberImage' },
        { label: '设备配置许可证(甲乙类设备)', value: 'configLicense' },
        { label: '设备合同', value: 'equipmentContract' },
        { label: '院务会纪要', value: 'hospitalMeeting' },
        { label: '党务会纪要', value: 'partyMeeting' }
      ],
      // 表单参数
      form: {
        assetCode: '',
        hospitalCode: '',
        barcode: '',
        assetName: '',
        assetAlias: '',
        auxiliaryCategory: '',
        assetStatus: '正常使用', // 默认正常使用
        financialCategory: '',
        financialCode: '',
        brand: '',
        origin: '',
        country: '',
        specification: '',
        model: '',
        unit: '',
        archiveCode: '',
        serialNumber: '',
        assetManager: '',
        maintenanceManager: '',
        useDepartment: '',
        manageDepartment: '',
        storageLocation: '',
        assetType: '',
        factoryNumber: '',
        productionDate: '',
        registrationNumber: '',
        expectedOperationDate: '',
        fundSource: '',
        invoiceNumber: '',
        invoiceAmount: 0,
        attachedAssetFlag: '',
        emergencyAsset: '',
        specialAsset: '',
        measurementAsset: '',
        attachedMaterialsList: [],
        additionalInfoList: [],
        benefitAnalysis: '',
        remark: '',
        power: '',
        theoryOperationTime: 0,
        publicEquipment: '',
        creator: '',
        createTime: '',
        modifier: '',
        modifyTime: '',
        archiveUsage: '',
        contractConsistent: '',
        specialNetworkAsset: '',
        building: '',
        floor: '',
        quantity: 0,
        contractName: '',
        contractPrice: 0,
        signDate: '',
        purchaseDate: '',
        acceptanceDate: '',
        reviewTime: '',
        warrantyExpireDate: '',
        bidDate: '',
        supplyNoticeDate: '',
        firstAcceptanceDate: '',
        deliveryDeadline: '',
        secondAcceptanceDate: '',
        warrantyOutDate: '',
        contractDetailList: [],
        accessoryDetailList: [],
        transferRecordList: [],
        maintenanceRecordList: [],
        careRecordList: [],
        measurementTestList: [],
        deviceImageList: [],
        similarDeviceList: [],
        inspectionRecordList: [],
        qualityTestList: [],
        trainingRecordList: [],
        borrowRecordList: [],
        adverseEventList: [],
        deviceOperatorList: [],
        operatorCertificateList: [],
        assetCardList: [],
        assetCardList: [],
        supplier: '',
        supplierContact: '',
        supplierPhone: '',
        maintenanceCompany: '',
        maintenanceContact: '',
        maintenancePhone: '',
        manufacturer: '',
        purchaseMethod: '',
        biddingForm: '',
        singleBudget: 0,
        projectBasis: '',
        biddingNumber: '',
        biddingDate: '',
        biddingAmount: 0,
        purchaseApproval: '',
        contractDocument: '',
        acceptanceReport: '',
        invoice: '',
        certificate: '',
        manual: '',
        measurementCertificate: '',
        safetyCertificate: '',
        radiationReport: '',
        repairOrder: '',
        contractAttachment: '',
        inspectionImage: '',
        maintenanceImage: '',
        qualityControlImage: '',
        customsDocument: '',
        inspectionQualification: ''
      },
      // 表单校验
      rules: {
        assetCode: [
          { required: true, message: "档案编码不能为空", trigger: "blur" },
          { validator: (rule, value, callback) => {
            if (!value) {
              callback();
              return;
            }

            // 只验证编码不能为空，不限制长度和格式
            // 手工输入的编码可以是任意长度和格式
            // 自动生成的编码格式：分类编码-年月日序号

            // 检查编码是否已存在（排除当前编辑的记录）
            listEquipment({ assetCode: value, pageNum: 1, pageSize: 1 }).then(response => {
              if (response.rows && response.rows.length > 0) {
                const existingEquipment = response.rows[0];
                // 如果是新增模式，或者存在其他记录的编码，则报错
                if (!this.form.id || existingEquipment.id !== this.form.id) {
                  callback(new Error('该档案编码已存在，请使用其他编码'));
                } else {
                  callback();
                }
              } else {
                callback();
              }
            }).catch(() => {
              callback();
            });
          }, trigger: "blur" }
        ],
        assetName: [
          { required: true, message: "档案名称不能为空", trigger: "blur" }
        ],
        assetStatus: [
          { required: true, message: "资产状态不能为空", trigger: "change" }
        ],
        financialCategory: [
          { required: true, message: "财务分类不能为空", trigger: "change" }
        ],
        useDepartment: [
          { required: true, message: "使用科室不能为空", trigger: "change" }
        ]
      }
    };
  },
  computed: {
    /** 过滤后的资产分类选项列表（支持按名称和编码搜索） */
    filteredAssetCategoryOptions() {
      if (!this.assetCategoryKeyword || !this.assetCategoryKeyword.trim()) {
        return this.assetCategoryOptions;
      }
      const keyword = this.assetCategoryKeyword.trim().toLowerCase();
      return this.assetCategoryOptions.filter(item => {
        const name = (item.name || '').toLowerCase();
        const code = (item.code || '').toLowerCase();
        return name.includes(keyword) || code.includes(keyword);
      });
    },
    /** 过滤后的文档类型列表（根据搜索名称过滤） */
    filteredDocumentTypeList() {
      // 如果搜索框为空，返回所有类型
      if (!this.documentSearchName || !this.documentSearchName.trim()) {
        return this.documentTypeList;
      }

      // 根据搜索名称过滤文件类型列表
      const searchKeyword = this.documentSearchName.trim().toLowerCase();
      return this.documentTypeList.filter(type =>
        type.label && type.label.toLowerCase().includes(searchKeyword)
      );
    },
    /** 过滤后的文档列表 */
    filteredDocumentList() {
      // 根据搜索名称和选中的类型过滤文档列表
      let filtered = this.documentFileList;

      // 按搜索名称过滤
      if (this.documentSearchName) {
        filtered = filtered.filter(file =>
          file.name && file.name.toLowerCase().includes(this.documentSearchName.toLowerCase())
        );
      }

      // 按选中的类型过滤
      if (this.selectedDocumentType) {
        filtered = filtered.filter(file =>
          file.type === this.selectedDocumentType
        );
      }

      return filtered;
    }
  },
  created() {
    this.loadTreeData();
    this.getList();
    this.loadDepartmentOptions();
    this.loadWarehouseOptions();
    this.loadUnitOptions();
    this.loadUserOptions();
    this.loadAssetCategoryOptions();
    this.loadSupplierOptions();
    this.loadFactoryOptions();
  },
  methods: {
    /** 加载68分类树形数据 */
    loadTreeData() {
      treeselect().then(response => {
        const allData = response.data || [];
        // 构建树形数据
        const tree = this.buildTree(allData, 0);
        this.treeData = [{
          category68Id: 'root',
          category68Name: '全部68分类',
          children: tree
        }];
        // 默认只展开根节点，一级分类显示但折叠（向右箭头），二级及以下不显示
        this.defaultExpandedKeys = ['root'];
      }).catch(() => {
        console.error('加载68分类树失败');
      });
    },
    /** 构建树形结构 */
    buildTree(data, parentId) {
      const tree = [];
      data.forEach(item => {
        if (item.parentId === parentId || (parentId === 0 && (item.parentId === null || item.parentId === 0))) {
          const children = this.buildTree(data, item.category68Id);
          if (children.length > 0) {
            item.children = children;
          }
          tree.push(item);
        }
      });
      return tree;
    },
    /** 68分类树节点点击事件 */
    handleCategoryNodeClick(data) {
      if (data.category68Id !== 'root') {
        // 根据选中的分类筛选资产列表
        this.queryParams.category68Id = data.category68Id;
        this.handleQuery();
      } else {
        // 点击根节点，清除分类筛选
        this.queryParams.category68Id = undefined;
        this.handleQuery();
      }
    },
    /** 加载科室选项列表 */
    loadDepartmentOptions() {
      // 获取当前登录用户ID（用于获取所有科室）
      const currentUserId = this.$store?.state?.user?.userId || 1; // 默认使用管理员ID
      listdepartAll(currentUserId).then(response => {
        console.log('获取科室列表 - response:', response);
        // 将科室数据转换为 {id, name} 格式
        const departments = response || [];
        this.departmentOptions = departments.map(item => ({
          id: item.id ? String(item.id) : item.id, // 统一转换为字符串，确保类型匹配
          name: item.name || item.departmentName || ''
        }));
        console.log('处理后的科室列表:', this.departmentOptions);
      }).catch(error => {
        console.error('获取科室列表失败:', error);
        this.departmentOptions = [];
      });
    },
    /** 加载仓库选项列表（仅设备类型） */
    loadWarehouseOptions() {
      // 获取当前登录用户ID（用于获取所有仓库）
      const currentUserId = this.$store?.state?.user?.userId || 1; // 默认使用管理员ID
      listWarehouseAll(currentUserId).then(response => {
        console.log('获取仓库列表 - response:', response);
        // 过滤出仓库类型为"设备"的仓库
        const warehouses = response || [];
        this.warehouseOptions = warehouses
          .filter(item => item.warehouseType === '设备')
          .map(item => ({
            id: item.id ? String(item.id) : item.id, // 统一转换为字符串，确保类型匹配
            name: item.name || item.warehouseName || ''
          }));
        console.log('处理后的设备类型仓库列表:', this.warehouseOptions);
      }).catch(error => {
        console.error('获取仓库列表失败:', error);
        this.warehouseOptions = [];
      });
    },
    /** 加载单位选项列表 */
    loadUnitOptions() {
      listUnitAll().then(response => {
        console.log('获取单位列表 - response:', response);
        // 将单位数据转换为 {id, name} 格式
        const units = response || [];
        this.unitOptions = units.map(item => ({
          id: item.unitId,
          name: item.unitName
        }));
        console.log('处理后的单位列表:', this.unitOptions);
      }).catch(error => {
        console.error('获取单位列表失败:', error);
        this.unitOptions = [];
      });
    },
    /** 加载用户选项列表 */
    loadUserOptions() {
      listUserAll().then(response => {
        console.log('获取用户列表 - response:', response);
        // 将用户数据转换为 {id, name} 格式，使用 nickName 作为显示名称
        const users = response || [];
        this.userOptions = users.map(item => ({
          id: item.userId,
          name: item.nickName || item.userName || ''
        })).filter(item => item.name); // 过滤掉没有姓名的用户
        console.log('处理后的用户列表:', this.userOptions);
      }).catch(error => {
        console.error('获取用户列表失败:', error);
        this.userOptions = [];
      });
    },
    /** 加载供应商选项列表 */
    loadSupplierOptions() {
      // 使用分页方式获取所有供应商，参考供应商维护页面的实现
      listSupplier({ pageNum: 1, pageSize: 10000 }).then(response => {
        console.log('获取供应商列表 - response:', response);
        const allSuppliers = response.rows || response.data || [];
        console.log('获取供应商列表 - allSuppliers:', allSuppliers);
        // 直接取所有供应商，不进行类型过滤
        this.supplierOptions = allSuppliers.map(supplier => ({
          id: supplier.id,
          name: supplier.name,
          code: supplier.code
        }));
        console.log('处理后的供应商列表:', this.supplierOptions);
      }).catch(error => {
        console.error('获取供应商列表失败:', error);
        this.supplierOptions = [];
      });
    },
    /** 加载生产厂家选项列表 */
    loadFactoryOptions() {
      // 使用分页方式获取所有生产厂家，参考生产厂家维护页面的实现
      listFactory({ pageNum: 1, pageSize: 10000 }).then(response => {
        console.log('获取生产厂家列表 - response:', response);
        const allFactories = response.rows || response.data || [];
        console.log('获取生产厂家列表 - allFactories:', allFactories);
        // 直接取所有生产厂家
        this.factoryOptions = allFactories.map(factory => ({
          id: factory.factoryId,
          name: factory.factoryName,
          code: factory.factoryCode
        }));
        console.log('处理后的生产厂家列表:', this.factoryOptions);
      }).catch(error => {
        console.error('获取生产厂家列表失败:', error);
        this.factoryOptions = [];
      });
    },
    /** 加载资产分类选项列表（从68分类菜单获取） */
    loadAssetCategoryOptions() {
      // 使用68分类的listAll方法获取所有分类数据
      listCategory68All().then(response => {
        console.log('获取68分类列表 - 原始response:', response);
        // 从响应中获取分类列表
        let categories = [];
        if (Array.isArray(response)) {
          categories = response;
        } else if (response && response.data) {
          categories = Array.isArray(response.data) ? response.data : [];
        } else if (response && response.rows) {
          categories = Array.isArray(response.rows) ? response.rows : [];
        }
        console.log('提取的68分类列表:', categories);
        // 展平树形结构，获取所有分类（包括子分类）
        const flatCategories = this.flattenCategory68Tree(categories);
        // 将68分类数据转换为 {id, name, code} 格式，支持按名称和编码搜索
        this.assetCategoryOptions = flatCategories.map(item => {
          const category = {
            id: item.category68Id || item.id,
            name: item.category68Name || item.name || '',
            code: item.category68Code || item.code || ''
          };
          console.log('转换后的68分类项:', category);
          return category;
        }).filter(item => item.name); // 过滤掉没有名称的分类
        console.log('最终资产分类列表（68分类）:', this.assetCategoryOptions);
        console.log('资产分类列表长度:', this.assetCategoryOptions.length);
      }).catch(error => {
        console.error('获取68分类列表失败:', error);
        console.error('错误详情:', error.response || error.message);
        // 静默处理错误，不显示错误提示，避免影响页面使用
        this.assetCategoryOptions = [];
      });
    },
    /** 展平68分类树形结构 */
    flattenCategory68Tree(tree, result = []) {
      if (!tree || !Array.isArray(tree)) {
        return result;
      }
      tree.forEach(item => {
        result.push(item);
        if (item.children && item.children.length > 0) {
          this.flattenCategory68Tree(item.children, result);
        }
      });
      return result;
    },
    /** 资产分类下拉框过滤方法 */
    filterAssetCategory(value) {
      this.assetCategoryKeyword = value || '';
    },
    /** 根据用户ID获取用户名称 */
    getUserName(userId) {
      if (!userId && userId !== 0 && userId !== '0') {
        return '';
      }
      // 如果用户选项列表为空，返回原始ID
      if (!this.userOptions || this.userOptions.length === 0) {
        console.warn('用户选项列表为空，无法查找用户名称，userId:', userId);
        return userId || '';
      }
      // 统一转换为字符串和数字进行比较，确保类型匹配
      const idStr = String(userId).trim();
      const user = this.userOptions.find(item => {
        const itemIdStr = String(item.id).trim();
        return itemIdStr === idStr;
      });
      if (user) {
        return user.name || '';
      }
      console.warn('未找到用户，userId:', userId);
      return userId || '';
    },
    /** 根据科室ID获取科室名称 */
    getDepartmentName(departmentId) {
      if (!departmentId && departmentId !== 0 && departmentId !== '0') {
        return '';
      }
      // 如果科室选项列表为空，返回原始ID
      if (!this.departmentOptions || this.departmentOptions.length === 0) {
        console.warn('科室选项列表为空，无法查找科室名称，departmentId:', departmentId);
        return departmentId || '';
      }
      // 统一转换为字符串和数字进行比较，确保类型匹配
      const idStr = String(departmentId).trim();
      const idNum = Number(departmentId);

      // 使用宽松匹配（==）和严格匹配（===）来查找科室
      const department = this.departmentOptions.find(item => {
        if (!item || (item.id === null && item.id !== 0)) {
          return false;
        }
        // 使用==进行宽松比较，可以处理字符串和数字的自动转换
        return item.id == departmentId ||
               String(item.id) === idStr ||
               Number(item.id) === idNum;
      });

      if (department && department.name) {
        return department.name;
      }

      // 如果找不到，输出调试信息
      console.warn('未找到科室名称 - departmentId:', departmentId, '类型:', typeof departmentId, '科室选项:', this.departmentOptions.map(d => ({id: d.id, name: d.name, idType: typeof d.id})));
      // 返回原始ID（可能是科室名称本身，或者ID）
      return departmentId || '';
    },
    /** 根据资产状态获取标签类型 */
    getAssetStatusTagType(status) {
      if (!status) return 'info';
      const statusMap = {
        '正常使用': 'success',
        '待维修': 'warning',
        '待拆分': 'warning',
        '报废': 'danger',
        '待报废': 'warning',
        '已损坏': 'danger',
        '待报废使用中': 'warning',
        '待报废未使用': 'warning'
      };
      return statusMap[status] || 'info';
    },
    /** 根据仓库ID获取仓库名称 */
    getWarehouseName(warehouseId) {
      if (!warehouseId && warehouseId !== 0 && warehouseId !== '0') {
        return '';
      }
      // 如果仓库选项列表为空，返回原始ID
      if (!this.warehouseOptions || this.warehouseOptions.length === 0) {
        return warehouseId || '';
      }
      // 统一转换为字符串和数字进行比较，确保类型匹配
      const idStr = String(warehouseId).trim();
      const idNum = Number(warehouseId);

      // 使用宽松匹配（==）和严格匹配（===）来查找仓库
      const warehouse = this.warehouseOptions.find(item => {
        if (!item || (item.id === null && item.id !== 0)) {
          return false;
        }
        // 使用==进行宽松比较，可以处理字符串和数字的自动转换
        return item.id == warehouseId ||
               String(item.id) === idStr ||
               Number(item.id) === idNum;
      });

      if (warehouse && warehouse.name) {
        return warehouse.name;
      }

      // 如果找不到，返回原始ID
      return warehouseId || '';
    },
    /** 查询设备信息列表 */
    getList() {
      this.loading = true;
      // 如果选择"仓库"，查询入库明细数据
      if (this.switchValue === '仓库') {
        const storageParams = {
          pageNum: this.queryParams.pageNum,
          pageSize: this.queryParams.pageSize,
          warehouseId: this.queryParams.warehouseId || null,
          storageStatus: '2' // 只查询已审核的入库单
        };
        listEquipmentStorage(storageParams).then(response => {
          // 获取入库单列表后，需要获取每个入库单的明细数据
          // 再次过滤，确保只处理已审核的入库单（双重保险）
          const storageList = (response.rows || []).filter(storage => storage.storageStatus === '2');
          const detailPromises = storageList.map(storage => {
            return getEquipmentStorage(storage.storageId).then(detailResponse => {
              const detailList = detailResponse.data.detailList || [];
              // 将入库单号添加到明细数据中
              return detailList.map(detail => ({
                ...detail,
                storageNo: storage.storageNo,
                warehouseName: storage.warehouseName
              }));
            });
          });

          Promise.all(detailPromises).then(allDetails => {
            // 合并所有明细数据
            const flatDetails = allDetails.flat();
            // 转换为类似设备信息的格式，用于显示在明细表格中
            this.form.similarDeviceList = flatDetails.map(detail => ({
              useStatus: '正常使用',
              archiveCode: detail.equipmentCode || '',
              deviceName: detail.equipmentName || '',
              specification: detail.specification || detail.spec || '',
              model: detail.model || detail.modelNo || '',
              enableDate: detail.productionDate || '',
              unitPrice: detail.unitPrice || detail.amount || 0,
              useDepartment: '',
              supplier: detail.supplier || '',
              originalDeviceCode: '',
              brand: detail.brand || '',
              storageNo: detail.storageNo || '',
              serialNumber: detail.serialNumber || detail.serialNo || '',
              category: '',
              productionDate: detail.productionDate || '',
              financialCode: detail.financialCode || '',
              factoryCode: '',
              maintenanceStatus: ''
            }));
            this.equipmentList = flatDetails.map((detail, index) => ({
              id: `storage_${detail.storageId}_${index}`,
              assetCode: detail.equipmentCode || '',
              assetName: detail.equipmentName || '',
              categoryCode: detail.categoryCode || '',
              specification: detail.specification || detail.spec || '',
              model: detail.model || detail.modelNo || '',
              useDepartment: '',
              manageDepartment: '',
              supplier: detail.supplier || '',
              hospitalCode: detail.warehouseName || '',
              storageNo: detail.storageNo || '', // 入库单号
              serialNumber: detail.serialNumber || detail.serialNo || '',
              barcode: detail.unitPrice || detail.amount || 0,
              assetStatus: '正常使用',
              brand: detail.brand || '',
              createTime: detail.createTime || '',
              // 保存原始明细数据，用于查看详情时显示
              _storageDetail: detail
            }));
            this.total = flatDetails.length;
            this.loading = false;
          }).catch(error => {
            console.error('获取入库明细失败:', error);
            this.loading = false;
          });
        }).catch(error => {
          console.error('获取入库列表失败:', error);
          this.loading = false;
        });
      } else {
        // 其他情况查询设备信息
        listEquipment(this.queryParams).then(response => {
          console.log('获取到的列表数据:', response.rows);
          // 处理分类编码：从档案编码中提取（格式：分类编码-年月日序号）
          this.equipmentList = (response.rows || []).map(item => {
            let categoryCode = '';
            if (item.assetCode && item.assetCode.includes('-')) {
              // 从档案编码中提取分类编码（-之前的部分）
              categoryCode = item.assetCode.split('-')[0];
            }
            return {
              ...item,
              categoryCode: categoryCode
            };
          });
          this.total = response.total;
          this.loading = false;
        });
      }
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
      this.documentActiveTab = 'purchaseApproval';
      // 重置文档管理相关数据
      this.documentSearchName = '';
      this.documentFileList = [];
      this.documentSelectedFiles = [];
      this.selectedDocumentType = '';
      this.typeListExpanded = true;
      this.previewFile = null;
      this.selectedUploadFile = null;
    },
    // 表单重置
    reset() {
      this.form = {
        assetCode: '',
        hospitalCode: '',
        barcode: '',
        assetName: '',
        assetAlias: '',
        auxiliaryCategory: '',
        assetStatus: '正常使用', // 默认正常使用
        financialCategory: '',
        financialCode: '',
        brand: '',
        origin: '',
        country: '',
        specification: '',
        model: '',
        unit: '',
        archiveCode: '',
        serialNumber: '',
        assetManager: '',
        maintenanceManager: '',
        useDepartment: '',
        manageDepartment: '',
        storageLocation: '',
        assetType: '',
        factoryNumber: '',
        productionDate: '',
        registrationNumber: '',
        expectedOperationDate: '',
        fundSource: '',
        invoiceNumber: '',
        invoiceAmount: 0,
        attachedAssetFlag: '',
        emergencyAsset: '',
        specialAsset: '',
        measurementAsset: '',
        attachedMaterialsList: [],
        additionalInfoList: [],
        benefitAnalysis: '',
        remark: '',
        power: '',
        theoryOperationTime: 0,
        publicEquipment: '',
        creator: '',
        createTime: '',
        modifier: '',
        modifyTime: '',
        archiveUsage: '',
        contractConsistent: '',
        specialNetworkAsset: '',
        building: '',
        floor: '',
        quantity: 0,
        contractName: '',
        contractPrice: 0,
        signDate: '',
        purchaseDate: '',
        acceptanceDate: '',
        reviewTime: '',
        warrantyExpireDate: '',
        bidDate: '',
        supplyNoticeDate: '',
        firstAcceptanceDate: '',
        deliveryDeadline: '',
        secondAcceptanceDate: '',
        warrantyOutDate: '',
        contractDetailList: [],
        accessoryDetailList: [],
        transferRecordList: [],
        maintenanceRecordList: [],
        careRecordList: [],
        measurementTestList: [],
        deviceImageList: [],
        similarDeviceList: [],
        inspectionRecordList: [],
        qualityTestList: [],
        trainingRecordList: [],
        borrowRecordList: [],
        adverseEventList: [],
        deviceOperatorList: [],
        operatorCertificateList: [],
        assetCardList: [],
        assetCardList: [],
        supplier: '',
        supplierContact: '',
        supplierPhone: '',
        maintenanceCompany: '',
        maintenanceContact: '',
        maintenancePhone: '',
        manufacturer: '',
        purchaseMethod: '',
        biddingForm: '',
        singleBudget: 0,
        projectBasis: '',
        biddingNumber: '',
        biddingDate: '',
        biddingAmount: 0,
        purchaseApproval: '',
        contractDocument: '',
        acceptanceReport: '',
        invoice: '',
        certificate: '',
        manual: '',
        measurementCertificate: '',
        safetyCertificate: '',
        radiationReport: '',
        repairOrder: '',
        contractAttachment: '',
        inspectionImage: '',
        maintenanceImage: '',
        qualityControlImage: '',
        customsDocument: '',
        inspectionQualification: ''
      };
      this.resetForm("form");
      this.documentActiveTab = 'purchaseApproval';
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
    /** 导入按钮操作 */
    handleImport() {
      this.upload.title = "资产导入";
      this.upload.open = true;
    },
    /** 下载模板操作 */
    importTemplate() {
      this.download('equipment/info/importTemplate', {
      }, `设备固定资产导入模板.xlsx`)
    },
    // 文件上传中处理
    handleFileUploadProgress(event, file, fileList) {
      this.upload.isUploading = true;
    },
    // 文件上传成功处理
    handleFileSuccess(response, file, fileList) {
      this.upload.open = false;
      this.upload.isUploading = false;
      this.$refs.upload.clearFiles();
      this.$alert("<div style='overflow: auto;overflow-x: hidden;max-height: 70vh;padding: 10px 20px 0;'>" + response.msg + "</div>", "导入结果", { dangerouslyUseHTMLString: true });
      this.getList();
    },
    // 提交上传文件
    submitFileForm() {
      this.$refs.upload.submit();
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 处理资产编码输入 */
    handleAssetCodeInput(value) {
      // 如果用户清空编码，在blur时自动生成
      if (!value || value.trim() === '') {
        this.form.assetCode = '';
      }
    },
    /** 生成档案编码 */
    async generateArchiveCode(categoryCode) {
      if (!categoryCode) {
        return '';
      }

      // 获取当前日期
      const now = new Date();
      const year = String(now.getFullYear()).slice(-2); // 后两位年份，如25
      const month = String(now.getMonth() + 1).padStart(2, '0'); // 月份，如12
      const day = String(now.getDate()).padStart(2, '0'); // 日期，如08
      const dateStr = month + day; // 月日，如1208

      // 查询当天已有的相同前缀的编码数量
      try {
        const prefix = `${categoryCode}-${year}${dateStr}`;
        const response = await listEquipment({ pageNum: 1, pageSize: 10000 });
        const equipmentList = response.rows || response.data || [];

        // 筛选出当天相同分类的编码
        const todayCodes = equipmentList
          .map(item => item.assetCode)
          .filter(code => code && code.startsWith(prefix))
          .map(code => {
            // 提取序号部分（最后两位）
            const parts = code.split('-');
            if (parts.length === 2) {
              const seqPart = parts[1].slice(-2);
              const seq = parseInt(seqPart);
              return isNaN(seq) ? 0 : seq;
            }
            return 0;
          })
          .filter(seq => seq > 0);

        // 计算下一个序号
        const nextSeq = todayCodes.length > 0 ? Math.max(...todayCodes) + 1 : 1;
        const seqStr = String(nextSeq).padStart(2, '0');

        return `${prefix}${seqStr}`;
      } catch (error) {
        console.error('查询编码失败:', error);
        // 如果查询失败，默认从01开始
        return `${categoryCode}-${year}${dateStr}01`;
      }
    },
    /** 处理资产分类变化 */
    async handleAssetCategoryChange(categoryName) {
      if (!categoryName || this.form.id != null) {
        // 如果是修改模式，不自动生成
        return;
      }

      // 根据分类名称找到对应的编码
      const category = this.assetCategoryOptions.find(item => item.name === categoryName);
      if (category && category.code) {
        // 自动生成档案编码
        this.form.assetCode = await this.generateArchiveCode(category.code);
        // 触发验证
        this.$nextTick(() => {
          this.$refs.form.validateField('assetCode');
        });
      }
    },
    /** 验证档案编码（blur事件） */
    async validateAssetCode() {
      if (!this.form.assetCode || this.form.assetCode.trim() === '') {
        // 如果没有输入编码且已选择资产分类，自动生成
        if (this.form.assetType) {
          const category = this.assetCategoryOptions.find(item => item.name === this.form.assetType);
          if (category && category.code) {
            this.form.assetCode = await this.generateArchiveCode(category.code);
          }
        }
        // 触发验证
        this.$nextTick(() => {
          this.$refs.form.validateField('assetCode');
        });
      } else {
        // 如果有输入，验证唯一性
        this.$refs.form.validateField('assetCode');
      }
    },
    /** 切换按钮操作 */
    handleSwitchChange(value) {
      // 切换按钮变化时的处理逻辑（全部/科室/仓库）
      console.log('切换按钮状态:', value);
      // 重置查询参数
      this.queryParams.pageNum = 1;
      if (value === '仓库') {
        // 选择仓库时，清空其他查询条件，只保留仓库相关
        this.queryParams.warehouseId = null;
      } else {
        this.queryParams.warehouseId = null;
      }
      this.getList();
    },
    /** 新增按钮操作 */
    async handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加设备信息";
      // 不自动生成编码，等待用户选择资产分类后自动生成
      this.form.assetCode = '';
      // 自动填充录入人和录入日期（精确到秒）
      const currentUser = this.$store?.state?.user?.name || '';
      this.form.creator = currentUser;
      // 格式化当前时间为 yyyy-MM-dd HH:mm:ss
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      this.form.createTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },
    /** 查看详情按钮操作 */
    handleView(row) {
      // 如果是仓库查询，使用档案编码查询；否则使用ID查询
      if (this.switchValue === '仓库' && row.assetCode) {
        // 使用档案编码查询设备信息
        getEquipmentByAssetCode(row.assetCode).then(response => {
          if (!response.data || !response.data.id) {
            // 如果查询不到设备信息，使用入库明细数据
            if (row._storageDetail) {
              this.loadStorageDetail(row._storageDetail);
            } else {
              this.$modal.msgWarning('未找到对应的设备信息，档案编码：' + row.assetCode);
            }
            return;
          }
          this.loadEquipmentDetail(response.data);
        }).catch(error => {
          console.error('根据档案编码查询设备失败:', error);
          // 查询失败时，如果有明细数据，使用明细数据
          if (row._storageDetail) {
            this.loadStorageDetail(row._storageDetail);
          } else {
            this.$modal.msgError('查询设备信息失败');
          }
        });
        return;
      }

      const id = row.id;
      getEquipment(id).then(response => {
        this.loadEquipmentDetail(response.data);
      }).catch(error => {
        console.error('获取设备数据失败:', error);
        this.$modal.msgError('获取设备信息失败');
      });
    },
    /** 加载设备详情数据 */
    loadEquipmentDetail(data) {
        this.form = { ...this.form, ...data };
        // 处理附属资料列表
        if (this.form.attachedMaterials) {
          try {
            this.form.attachedMaterialsList = JSON.parse(this.form.attachedMaterials);
          } catch (e) {
            this.form.attachedMaterialsList = [];
          }
        } else {
          this.form.attachedMaterialsList = [];
        }
        // 处理附加信息列表
        this.form.additionalInfoList = [];
        if (this.form.emergencyAsset === '1' || this.form.emergencyAsset === 1) {
          this.form.additionalInfoList.push('急救/生命支持');
        }
        if (this.form.specialAsset === '1' || this.form.specialAsset === 1) {
          this.form.additionalInfoList.push('特种设备');
        }
        if (this.form.measurementAsset === '1' || this.form.measurementAsset === 1) {
          this.form.additionalInfoList.push('计量设备');
        }
        if (this.form.benefitAnalysis === '1' || this.form.benefitAnalysis === 1) {
          this.form.additionalInfoList.push('效益分析');
        }
        if (this.form.publicEquipment === '1' || this.form.publicEquipment === 1) {
          this.form.additionalInfoList.push('公用设备');
        }
        // 新增字段映射（需要根据后端实际字段名调整）
        // 如果后端有对应字段，可以这样处理：
        // if (this.form.researchEducation === '1' || this.form.researchEducation === 1) {
        //   this.form.additionalInfoList.push('科研/科教');
        // }
        // 其他新增字段类似处理

        // 映射生产厂家字段：后端返回的是manufacturer，表单使用的是factoryId
        if (this.form.manufacturer) {
          this.form.factoryId = this.form.manufacturer;
        }

        // 统一ID类型为字符串，确保下拉框能正确匹配显示
        if (this.form.hospitalCode !== null && this.form.hospitalCode !== undefined) {
          this.form.hospitalCode = String(this.form.hospitalCode);
        }
        if (this.form.useDepartment !== null && this.form.useDepartment !== undefined) {
          this.form.useDepartment = String(this.form.useDepartment);
        }
        if (this.form.manageDepartment !== null && this.form.manageDepartment !== undefined) {
          this.form.manageDepartment = String(this.form.manageDepartment);
        }

        this.viewOpen = true;
    },
    /** 加载入库明细数据到详情页面 */
    loadStorageDetail(detail) {
      // 保存入库明细数据，供修改时使用
      if (detail && detail.equipmentCode) {
        this.currentStorageDetail = detail;
        this.currentStorageDetailKey = detail.equipmentCode;
      }

      // 将入库明细数据转换为设备信息格式
      this.form = {
        ...this.form,
        assetCode: detail.equipmentCode || '',
        assetName: detail.equipmentName || '',
        specification: detail.specification || detail.spec || '',
        model: detail.model || detail.modelNo || '',
        brand: detail.brand || '',
        serialNumber: detail.serialNumber || detail.serialNo || '',
        barcode: detail.unitPrice || detail.amount || 0,
        supplier: detail.dealer || detail.supplier || '', // 经销商映射到供应商
        factoryId: detail.manufacturer || '', // 生产商映射到生产厂家
        registrationNumber: detail.registrationNo || '', // 注册证号
        unit: detail.unit || '', // 单位（入库明细中的单位）
        quantity: detail.quantity || 0, // 数量（入库明细中的数量）
        hospitalCode: detail.warehouseName || detail.warehouseId || '',
        assetStatus: '正常使用',
        // 其他字段保持为空或默认值
        id: null, // 标记这不是已存在的设备信息
        attachedMaterialsList: [],
        additionalInfoList: []
      };

      // 根据分类编码查找所属分类名称
      if (detail.categoryCode && this.assetCategoryOptions && this.assetCategoryOptions.length > 0) {
        const category = this.assetCategoryOptions.find(item => item.code === detail.categoryCode);
        if (category) {
          this.form.assetType = category.name;
        } else {
          // 如果找不到，尝试通过分类编码的前缀匹配
          const matchedCategory = this.assetCategoryOptions.find(item =>
            item.code && detail.categoryCode && item.code.startsWith(detail.categoryCode.substring(0, 2))
          );
          if (matchedCategory) {
            this.form.assetType = matchedCategory.name;
          }
        }
      }

      // 统一ID类型为字符串
      if (this.form.hospitalCode !== null && this.form.hospitalCode !== undefined) {
        this.form.hospitalCode = String(this.form.hospitalCode);
      }

      this.viewOpen = true;
      // 提示用户这是入库明细数据
      this.$modal.msgInfo('当前显示的是入库明细数据，该档案编码尚未创建设备信息记录');
    },
    /** 加载入库明细数据用于编辑 */
    loadStorageDetailForEdit(detail) {
      console.log('从入库明细加载的编辑数据 - detail:', detail);
      console.log('detail 的类型:', typeof detail);
      console.log('detail 是否为 null/undefined:', detail === null || detail === undefined);
      if (detail) {
        console.log('detail 的键:', Object.keys(detail));
        console.log('detail.equipmentCode:', detail.equipmentCode);
        console.log('detail.equipmentName:', detail.equipmentName);
        console.log('detail.warehouseName:', detail.warehouseName);
        console.log('detail.warehouseId:', detail.warehouseId);
      }

      // 检查 detail 是否有效
      if (!detail || (typeof detail === 'object' && Object.keys(detail).length === 0)) {
        console.error('入库明细数据无效:', detail);
        this.$modal.msgError('入库明细数据无效，无法加载编辑表单');
        return;
      }

      // 先重置表单，避免保留之前的值
      this.reset();

      // 将入库明细数据转换为设备信息格式
      this.form = {
        ...this.form,
        assetCode: detail.equipmentCode || '',
        assetName: detail.equipmentName || '',
        specification: detail.specification || detail.spec || '',
        model: detail.model || detail.modelNo || '',
        brand: detail.brand || '',
        serialNumber: detail.serialNumber || detail.serialNo || '',
        barcode: detail.unitPrice || detail.amount || 0,
        supplier: detail.dealer || detail.supplier || '', // 经销商映射到供应商
        manufacturer: detail.manufacturer || '', // 生产商
        factoryId: detail.manufacturer || '', // 生产商映射到生产厂家（下拉框使用名称）
        registrationNumber: detail.registrationNo || '', // 注册证号
        unit: detail.unit || '', // 单位（入库明细中的单位）
        quantity: detail.quantity || 0, // 数量（入库明细中的数量）
        hospitalCode: detail.warehouseId || detail.warehouseName || '', // 仓库ID或名称
        assetStatus: '正常使用',
        // 其他字段保持为空或默认值
        id: 'EDIT_FROM_STORAGE', // 标记这是从入库明细加载的编辑模式，用于禁用档案编码
        attachedMaterialsList: [],
        additionalInfoList: [],
        contractDetailList: []
      };

      // 根据分类编码查找所属分类名称
      if (detail.categoryCode && this.assetCategoryOptions && this.assetCategoryOptions.length > 0) {
        const category = this.assetCategoryOptions.find(item => item.code === detail.categoryCode);
        if (category) {
          this.form.assetType = category.name;
        } else {
          // 如果找不到，尝试通过分类编码的前缀匹配
          const matchedCategory = this.assetCategoryOptions.find(item =>
            item.code && detail.categoryCode && item.code.startsWith(detail.categoryCode.substring(0, 2))
          );
          if (matchedCategory) {
            this.form.assetType = matchedCategory.name;
          }
        }
      }

      // 处理仓库下拉框：如果是仓库名称，需要找到对应的ID
      if (this.form.hospitalCode !== null && this.form.hospitalCode !== undefined && this.form.hospitalCode !== '') {
        // 如果是仓库名称（字符串且不是数字），需要找到对应的ID
        if (typeof this.form.hospitalCode === 'string' && isNaN(this.form.hospitalCode)) {
          // 是名称，需要查找ID
          const warehouse = this.warehouseOptions.find(w => w.name === this.form.hospitalCode);
          if (warehouse) {
            this.form.hospitalCode = String(warehouse.id);
          } else {
            // 如果找不到，保持为空，让用户重新选择
            this.form.hospitalCode = '';
          }
        } else {
          // 是ID，转换为字符串
          this.form.hospitalCode = String(this.form.hospitalCode);
        }
      } else {
        this.form.hospitalCode = '';
      }

      // 处理供应商下拉框：确保供应商名称匹配下拉框选项
      if (this.form.supplier && this.supplierOptions && this.supplierOptions.length > 0) {
        const supplier = this.supplierOptions.find(s => s.name === this.form.supplier || s.supplierName === this.form.supplier);
        if (!supplier) {
          // 如果找不到匹配的供应商，保持原值（可能是新供应商）
          console.log('供应商未在下拉框中找到:', this.form.supplier);
        }
      }

      // 处理生产厂家下拉框：确保生产厂家名称匹配下拉框选项
      if (this.form.factoryId && this.factoryOptions && this.factoryOptions.length > 0) {
        const factory = this.factoryOptions.find(f => f.name === this.form.factoryId || f.factoryName === this.form.factoryId);
        if (!factory) {
          // 如果找不到匹配的生产厂家，保持原值（可能是新厂家）
          console.log('生产厂家未在下拉框中找到:', this.form.factoryId);
        }
      }

      // 处理单位下拉框：确保单位名称匹配下拉框选项
      if (this.form.unit && this.unitOptions && this.unitOptions.length > 0) {
        const unit = this.unitOptions.find(u => u.name === this.form.unit);
        if (!unit) {
          // 如果找不到匹配的单位，保持原值（可能是新单位）
          console.log('单位未在下拉框中找到:', this.form.unit);
        } else {
          // 确保单位值匹配下拉框选项
          this.form.unit = unit.name;
        }
      }

      // 确保所有字段都有值
      if (!this.form.assetCode) this.form.assetCode = '';
      if (!this.form.assetName) this.form.assetName = '';
      if (!this.form.specification) this.form.specification = '';
      if (!this.form.model) this.form.model = '';
      if (!this.form.registrationNumber) this.form.registrationNumber = '';
      if (!this.form.supplier) this.form.supplier = '';
      if (!this.form.factoryId) this.form.factoryId = '';
      if (!this.form.unit) this.form.unit = '';
      if (!this.form.serialNumber) this.form.serialNumber = '';
      if (this.form.quantity === null || this.form.quantity === undefined) {
        this.form.quantity = 0;
      }
      if (this.form.barcode === null || this.form.barcode === undefined || this.form.barcode === '') {
        this.form.barcode = 0;
      }

      // 设置标题
      this.title = "修改设备信息" + this.getViewDetailTitleSuffix();

      // 使用 $nextTick 确保下拉框选项已加载完成后再打开对话框
      this.$nextTick(() => {
        console.log('从入库明细加载的编辑数据 - form:', JSON.parse(JSON.stringify(this.form)));
        console.log('仓库选项:', this.warehouseOptions);
        console.log('供应商选项:', this.supplierOptions);
        console.log('生产厂家选项:', this.factoryOptions);
        console.log('单位选项:', this.unitOptions);

        // 再次处理仓库下拉框，确保选项已加载
        if (this.form.hospitalCode && typeof this.form.hospitalCode === 'string' && isNaN(this.form.hospitalCode)) {
          const warehouse = this.warehouseOptions.find(w => w.name === this.form.hospitalCode);
          if (warehouse) {
            this.form.hospitalCode = String(warehouse.id);
          }
        }

        // 打开对话框
        this.open = true;

        // 加载文档列表
        this.loadDocumentList();

        // 提示用户这是入库明细数据
        this.$modal.msgInfo('当前编辑的是入库明细数据，该档案编码尚未创建设备信息记录');
      });
    },
    /** 获取查看详情标题后缀 */
    getViewDetailTitleSuffix() {
      if (this.switchValue === '全部') {
        return '-全部';
      } else if (this.switchValue === '科室') {
        return '-科室';
      } else if (this.switchValue === '仓库') {
        return '-仓库';
      }
      return '';
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      // 如果 row 不存在，尝试从选中的行中获取
      if (!row) {
        if (this.ids && this.ids.length > 0) {
          const selectedRow = this.equipmentList.find(item => item.id === this.ids[0]);
          if (selectedRow) {
            row = selectedRow;
            console.log('从选中的行中获取数据:', row);
          } else {
            this.$modal.msgWarning('请先选择要修改的数据');
            return;
          }
        } else {
          this.$modal.msgWarning('请先选择要修改的数据');
          return;
        }
      }

      console.log('点击修改的行数据:', row);
      console.log('switchValue:', this.switchValue);
      console.log('_storageDetail:', row._storageDetail);
      console.log('assetCode:', row.assetCode);
      console.log('row.id:', row.id);
      console.log('currentStorageDetail:', this.currentStorageDetail);
      console.log('currentStorageDetailKey:', this.currentStorageDetailKey);
      console.log('equipmentList 长度:', this.equipmentList.length);
      console.log('equipmentList 中是否有 _storageDetail:', this.equipmentList.some(item => item._storageDetail));

      // 如果是仓库查询，使用档案编码查询；否则使用ID查询
      if (this.switchValue === '仓库' && row.assetCode) {
        // 优先级1: 如果 row._storageDetail 存在，直接使用
        let storageDetail = row._storageDetail;

        // 优先级2: 如果 row._storageDetail 不存在，尝试从保存的 currentStorageDetail 中获取
        if (!storageDetail || Object.keys(storageDetail).length === 0) {
          if (this.currentStorageDetail && this.currentStorageDetailKey === row.assetCode) {
            storageDetail = this.currentStorageDetail;
            console.log('从 currentStorageDetail 中获取到数据:', storageDetail);
          }
        }

        // 优先级3: 如果仍然没有，尝试从 equipmentList 中获取
        if (!storageDetail || Object.keys(storageDetail).length === 0) {
          console.warn('row._storageDetail 不存在，尝试从 equipmentList 中获取');
          console.log('查找条件 - assetCode:', row.assetCode, 'row.id:', row.id);
          console.log('equipmentList 所有项:', this.equipmentList.map(item => ({
            id: item.id,
            assetCode: item.assetCode,
            hasStorageDetail: !!item._storageDetail,
            storageDetailKeys: item._storageDetail ? Object.keys(item._storageDetail) : []
          })));

          // 优先通过 id 匹配（更可靠）
          let listItem = this.equipmentList.find(item => item.id === row.id);
          if (listItem && listItem._storageDetail) {
            storageDetail = listItem._storageDetail;
            console.log('通过 id 匹配找到 _storageDetail:', storageDetail);
          } else {
            // 如果通过 id 找不到，尝试通过 assetCode 匹配
            listItem = this.equipmentList.find(item => {
              const codeMatch = item.assetCode === row.assetCode;
              console.log('比较 - item.assetCode:', item.assetCode, 'row.assetCode:', row.assetCode, '匹配:', codeMatch);
              return codeMatch;
            });
            console.log('找到的 listItem:', listItem);
            if (listItem) {
              if (listItem._storageDetail) {
                storageDetail = listItem._storageDetail;
                console.log('从 equipmentList 中获取到 _storageDetail:', storageDetail);
              } else {
                console.warn('listItem 存在但没有 _storageDetail，listItem:', listItem);
              }
            } else {
              console.warn('在 equipmentList 中未找到匹配的项');
            }
          }
        }

        // 优先级4: 如果仍然没有明细数据，尝试从 row.id 中提取 storageId 重新获取
        if ((!storageDetail || Object.keys(storageDetail).length === 0) && row.id && typeof row.id === 'string' && row.id.startsWith('storage_')) {
          console.warn('尝试从 row.id 中提取 storageId 重新获取数据，row.id:', row.id);
          // row.id 格式: storage_${detail.storageId}_${index}
          const parts = row.id.split('_');
          console.log('row.id 分割后的 parts:', parts);
          if (parts.length >= 2) {
            const storageId = parts[1];
            console.log('提取的 storageId:', storageId);
            console.log('准备调用 getEquipmentStorage，参数:', storageId);
            // 重新获取入库明细数据
            getEquipmentStorage(Number(storageId)).then(response => {
              console.log('getEquipmentStorage 返回的数据:', response);
              const detailList = response.data.detailList || [];
              console.log('明细列表:', detailList);
              console.log('查找匹配的明细，assetCode:', row.assetCode);
              // 根据 assetCode 找到对应的明细项
              const matchedDetail = detailList.find(detail => {
                const codeMatch = detail.equipmentCode === row.assetCode;
                console.log('明细项 equipmentCode:', detail.equipmentCode, '匹配结果:', codeMatch);
                return codeMatch;
              });
              if (matchedDetail) {
                // 添加仓库名称等信息
                const detailWithWarehouse = {
                  ...matchedDetail,
                  warehouseName: response.data.warehouseName || row.hospitalCode || '',
                  warehouseId: response.data.warehouseId || '',
                  storageNo: response.data.storageNo || ''
                };
                console.log('重新获取到的入库明细数据:', detailWithWarehouse);
                // 保存到 currentStorageDetail 供后续使用
                this.currentStorageDetail = detailWithWarehouse;
                this.currentStorageDetailKey = row.assetCode;
                this.loadStorageDetailForEdit(detailWithWarehouse);
              } else {
                console.error('未找到匹配的入库明细，assetCode:', row.assetCode, '明细列表长度:', detailList.length);
                // 如果找不到精确匹配，尝试使用第一个明细项
                if (detailList.length > 0) {
                  console.warn('使用第一个明细项作为备选');
                  const detailWithWarehouse = {
                    ...detailList[0],
                    warehouseName: response.data.warehouseName || row.hospitalCode || '',
                    warehouseId: response.data.warehouseId || '',
                    storageNo: response.data.storageNo || ''
                  };
                  this.currentStorageDetail = detailWithWarehouse;
                  this.currentStorageDetailKey = row.assetCode;
                  this.loadStorageDetailForEdit(detailWithWarehouse);
                } else {
                  this.$modal.msgWarning('未找到对应的入库明细数据，档案编码：' + row.assetCode);
                }
              }
            }).catch(error => {
              console.error('重新获取入库明细失败:', error);
              console.error('错误详情:', error.response || error.message);
              // 如果重新获取失败，尝试查询设备信息
              this.tryLoadEquipmentByAssetCode(row.assetCode);
            });
            return;
          } else {
            console.error('row.id 格式不正确，无法提取 storageId，row.id:', row.id);
          }
        }

        // 如果存在入库明细数据，直接使用明细数据
        if (storageDetail && Object.keys(storageDetail).length > 0) {
          console.log('使用入库明细数据加载编辑表单，明细数据:', storageDetail);
          // 保存到 currentStorageDetail 供后续使用
          this.currentStorageDetail = storageDetail;
          this.currentStorageDetailKey = row.assetCode;
          this.loadStorageDetailForEdit(storageDetail);
          return;
        }

        // 如果没有明细数据，尝试查询设备信息
        console.warn('入库明细数据不存在或为空，尝试查询设备信息');
        this.tryLoadEquipmentByAssetCode(row.assetCode);
        return;
      }

      // 非仓库查询的逻辑保持不变
      const id = row.id || this.ids[0];
      console.log('要查询的ID:', id);
      getEquipment(id).then(response => {
        console.log('获取到的设备数据:', response.data);
        this.loadEquipmentDataForEdit(response.data);
      }).catch(error => {
        console.error('获取设备数据失败:', error);
        this.$modal.msgError("获取设备数据失败");
      });
    },
    /** 尝试根据档案编码加载设备信息 */
    tryLoadEquipmentByAssetCode(assetCode) {
      getEquipmentByAssetCode(assetCode).then(response => {
        if (!response.data || !response.data.id) {
          // 如果查询不到设备信息，提示用户
          this.$modal.msgWarning('未找到对应的设备信息，档案编码：' + assetCode);
          return;
        }
        this.loadEquipmentDataForEdit(response.data);
      }).catch(error => {
        console.error('根据档案编码查询设备失败:', error);
        this.$modal.msgError('查询设备信息失败');
      });
    },
    /** 加载设备数据用于编辑 */
    loadEquipmentDataForEdit(data) {
        this.form = { ...this.form, ...data };
        // 处理附属资料列表
        if (this.form.attachedMaterials) {
          try {
            this.form.attachedMaterialsList = JSON.parse(this.form.attachedMaterials);
          } catch (e) {
            this.form.attachedMaterialsList = [];
          }
        } else {
          this.form.attachedMaterialsList = [];
        }
        // 处理附加信息列表
        this.form.additionalInfoList = [];
        if (this.form.emergencyAsset === '1' || this.form.emergencyAsset === 1) {
          this.form.additionalInfoList.push('急救/生命支持');
        }
        if (this.form.specialAsset === '1' || this.form.specialAsset === 1) {
          this.form.additionalInfoList.push('特种设备');
        }
        if (this.form.measurementAsset === '1' || this.form.measurementAsset === 1) {
          this.form.additionalInfoList.push('计量设备');
        }
        if (this.form.benefitAnalysis === '1' || this.form.benefitAnalysis === 1) {
          this.form.additionalInfoList.push('效益分析');
        }
        if (this.form.publicEquipment === '1' || this.form.publicEquipment === 1) {
          this.form.additionalInfoList.push('公用设备');
        }
        // 处理合同明细列表
        if (this.form.contractDetailList && Array.isArray(this.form.contractDetailList)) {
          // 如果后端返回的是JSON字符串，需要解析
          if (typeof this.form.contractDetailList === 'string') {
            try {
              this.form.contractDetailList = JSON.parse(this.form.contractDetailList);
            } catch (e) {
              this.form.contractDetailList = [];
            }
          }
        } else {
          this.form.contractDetailList = [];
        }
        // 新增字段映射（需要根据后端实际字段名调整）
        // 如果后端有对应字段，可以这样处理：
        // if (this.form.researchEducation === '1' || this.form.researchEducation === 1) {
        //   this.form.additionalInfoList.push('科研/科教');
        // }
        // 其他新增字段类似处理

        // 映射生产厂家字段：后端返回的是manufacturer，表单使用的是factoryId（下拉框显示名称）
        if (this.form.manufacturer) {
          this.form.factoryId = this.form.manufacturer;
        } else {
          this.form.factoryId = '';
        }

        // 映射供应商字段：确保供应商名称正确显示（下拉框使用名称作为value）
        // 如果后端返回的是供应商名称，直接使用；如果需要匹配下拉框，可以在这里处理
        if (!this.form.supplier) {
          this.form.supplier = '';
        }

        // 统一ID类型为字符串，确保下拉框能正确匹配显示
        if (this.form.hospitalCode !== null && this.form.hospitalCode !== undefined) {
          // 如果是数字ID，转换为字符串；如果是名称，需要查找对应的ID
          if (typeof this.form.hospitalCode === 'string' && isNaN(this.form.hospitalCode)) {
            // 是名称，需要查找ID
            const warehouse = this.warehouseOptions.find(w => w.name === this.form.hospitalCode);
            if (warehouse) {
              this.form.hospitalCode = String(warehouse.id);
            }
          } else {
            this.form.hospitalCode = String(this.form.hospitalCode);
          }
        } else {
          this.form.hospitalCode = '';
        }
        if (this.form.useDepartment !== null && this.form.useDepartment !== undefined) {
          this.form.useDepartment = String(this.form.useDepartment);
        }
        if (this.form.manageDepartment !== null && this.form.manageDepartment !== undefined) {
          this.form.manageDepartment = String(this.form.manageDepartment);
        }

        // 确保所有字段都有值（即使是空字符串）
        // 档案编码
        if (!this.form.assetCode) {
          this.form.assetCode = '';
        }
        // 档案名称
        if (!this.form.assetName) {
          this.form.assetName = '';
        }
        // 规格
        if (!this.form.specification) {
          this.form.specification = '';
        }
        // 型号
        if (!this.form.model) {
          this.form.model = '';
        }
        // 注册证件号
        if (!this.form.registrationNumber) {
          this.form.registrationNumber = '';
        }
        // 单位
        if (!this.form.unit) {
          this.form.unit = '';
        }

        console.log('设置到表单的数据:', this.form);
        this.open = true;
        this.title = "修改设备信息" + this.getViewDetailTitleSuffix();
        // 加载文档列表
        this.loadDocumentList();
    },
    /** 新增明细 */
    handleAddDetail() {
      if (!this.form.contractDetailList) {
        this.form.contractDetailList = [];
      }
      this.form.contractDetailList.push({
        contractType: '',
        contractCode: '',
        contractName: '',
        contractPartyA: '',
        signer: '',
        signDate: '',
        maintenanceDate: '',
        contractAmount: 0,
        maintenanceCompany: '',
        maintenancePhone: '',
        projectNumber: '',
        purchaseMethod: '',
        fundSource: '',
        remark: ''
      });
    },
    /** 删除明细 */
    handleDeleteDetail(index) {
      this.$modal.confirm('确定要删除这条明细吗？').then(() => {
        this.form.contractDetailList.splice(index, 1);
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 新增附属配件明细 */
    handleAddAccessoryDetail() {
      if (!this.form.accessoryDetailList) {
        this.form.accessoryDetailList = [];
      }
      this.form.accessoryDetailList.push({
        barcode: '',
        accessoryName: '',
        accessoryCode: '',
        accessorySerialNumber: '',
        accessorySpecification: '',
        quantity: 0,
        unitPrice: 0,
        totalValue: 0,
        useStatus: ''
      });
    },
    /** 删除附属配件明细 */
    handleDeleteAccessoryDetail(index) {
      this.$modal.confirm('确定要删除这条明细吗？').then(() => {
        this.form.accessoryDetailList.splice(index, 1);
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 计算总价值 */
    calculateTotalValue(row) {
      if (row.quantity && row.unitPrice) {
        row.totalValue = parseFloat((row.quantity * row.unitPrice).toFixed(2));
      } else {
        row.totalValue = 0;
      }
    },
    /** 图片上传前验证 */
    beforeImageUpload(file) {
      const isImage = file.type.indexOf('image') !== -1;
      const isLt10M = file.size / 1024 / 1024 < 10;

      if (!isImage) {
        this.$modal.msgError('上传文件只能是图片格式!');
        return false;
      }
      if (!isLt10M) {
        this.$modal.msgError('上传图片大小不能超过 10MB!');
        return false;
      }
      return true;
    },
    /** 图片上传成功回调 */
    handleImageSuccess(response, file, index) {
      if (response.code === 200) {
        // 根据响应结构设置图片URL
        const imageUrl = response.url || response.fileName || (process.env.VUE_APP_BASE_API + '/' + response.fileName);
        this.form.deviceImageList[index].imageUrl = imageUrl;
        this.$modal.msgSuccess("图片上传成功");
      } else {
        this.$modal.msgError(response.msg || "图片上传失败");
      }
    },
    /** 资产卡片图片上传成功回调 */
    handleAssetCardImageSuccess(response, file, index) {
      if (response.code === 200) {
        // 根据响应结构设置图片URL
        const imageUrl = response.url || response.fileName || (process.env.VUE_APP_BASE_API + '/' + response.fileName);
        this.form.assetCardList[index].imageUrl = imageUrl;
        this.$modal.msgSuccess("图片上传成功");
      } else {
        this.$modal.msgError(response.msg || "图片上传失败");
      }
    },
    /** 选择设备图片文件 */
    handleSelectDeviceImageFile() {
      this.$refs.deviceImageFileInput.click();
    },
    /** 设备图片文件选择 */
    handleDeviceImageFileSelect(event) {
      const file = event.target.files[0];
      if (file) {
        if (!file.type.startsWith('image/')) {
          this.$modal.msgError('只能选择图片文件！');
          return;
        }
        if (file.size / 1024 / 1024 > 10) {
          this.$modal.msgError('图片大小不能超过 10MB！');
          return;
        }
        this.selectedDeviceImageFile = file;
      }
      // 清空input，以便可以重复选择同一文件
      event.target.value = '';
    },
    /** 上传设备图片 */
    async handleDeviceImageUpload() {
      if (!this.selectedDeviceImageFile) {
        this.$modal.msgWarning('请先选择图片文件！');
        return;
      }

      try {
        const formData = new FormData();
        formData.append('file', this.selectedDeviceImageFile);

        const response = await axios({
          url: process.env.VUE_APP_BASE_API + '/common/upload',
          method: 'post',
          data: formData,
          headers: {
            'Authorization': 'Bearer ' + this.$store.getters.token,
            'Content-Type': 'multipart/form-data'
          }
        });

        const responseData = response.data;

        if (!responseData || responseData.code !== 200) {
          this.$modal.msgError(responseData?.msg || "图片上传失败");
          return;
        }

        const imageUrl = responseData.url || '';
        if (!imageUrl) {
          this.$modal.msgError("图片上传失败：未返回图片URL");
          return;
        }

        // 添加到图片列表
        const newImage = {
          imageUrl: imageUrl,
          uploadDate: new Date(),
          uploadPerson: this.$store.getters.userId || '',
          fileName: responseData.fileName || this.selectedDeviceImageFile.name,
          originalFilename: responseData.originalFilename || this.selectedDeviceImageFile.name
        };

        if (!this.form.deviceImageList) {
          this.form.deviceImageList = [];
        }
        this.form.deviceImageList.push(newImage);

        this.$modal.msgSuccess("图片上传成功");
        this.selectedDeviceImageFile = null;
      } catch (error) {
        console.error('图片上传失败:', error);
        this.$modal.msgError("图片上传失败：" + (error.message || "未知错误"));
      }
    },
    /** 下载设备图片 */
    handleDeviceImageDownload() {
      if (this.deviceImageSelectedIndex < 0 || !this.form.deviceImageList[this.deviceImageSelectedIndex]) {
        this.$modal.msgWarning('请先选择要下载的图片！');
        return;
      }

      const image = this.form.deviceImageList[this.deviceImageSelectedIndex];
      const imageUrl = image.imageUrl;

      if (!imageUrl) {
        this.$modal.msgError('图片URL不存在！');
        return;
      }

      // 创建下载链接
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = image.originalFilename || image.fileName || '设备图片.jpg';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    /** 预览设备图片 */
    handleDeviceImagePreview() {
      if (this.deviceImageSelectedIndex < 0 || !this.form.deviceImageList[this.deviceImageSelectedIndex]) {
        this.$modal.msgWarning('请先选择要预览的图片！');
        return;
      }

      this.deviceImagePreviewVisible = true;
    },
    /** 格式化日期 */
    formatDate(date) {
      if (!date) return '';
      const d = new Date(date);
      return d.getFullYear() + '-' +
             String(d.getMonth() + 1).padStart(2, '0') + '-' +
             String(d.getDate()).padStart(2, '0');
    },
    /** 获取用户名 */
    getUserName(userId) {
      if (!userId) return '';
      const user = this.userOptions.find(u => u.id === userId);
      return user ? user.name : userId;
    },
    /** 图片加载错误处理 */
    handleImageError(event) {
      event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+5Zu+54mH5pyq5Yqg6L29PC90ZXh0Pjwvc3ZnPg==';
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          // 将附加信息列表转换回原来的字段
          const submitData = { ...this.form };
          submitData.emergencyAsset = submitData.additionalInfoList.includes('急救/生命支持') ? '1' : '0';
          submitData.specialAsset = submitData.additionalInfoList.includes('特种设备') ? '1' : '0';
          submitData.measurementAsset = submitData.additionalInfoList.includes('计量设备') ? '1' : '0';
          submitData.benefitAnalysis = submitData.additionalInfoList.includes('效益分析') ? '1' : '0';
          submitData.publicEquipment = submitData.additionalInfoList.includes('公用设备') ? '1' : '0';
          // 新增字段映射（需要根据后端实际字段名调整）
          // 如果后端有对应字段，可以这样处理：
          // submitData.researchEducation = submitData.additionalInfoList.includes('科研/科教') ? '1' : '0';
          // submitData.largeEquipment = submitData.additionalInfoList.includes('大型设备') ? '1' : '0';
          // 其他新增字段类似处理

          // 映射生产厂家字段：表单使用的是factoryId，后端字段是manufacturer
          if (submitData.factoryId) {
            submitData.manufacturer = submitData.factoryId;
          }
          // 删除factoryId字段，避免后端报错
          delete submitData.factoryId;

          if (this.form.id != null) {
            updateEquipment(submitData).then(response => {
              // 保存文件列表到后端
              this.saveDocumentFiles();
              this.$modal.msgSuccess("修改成功");
              // 不关闭对话框，继续修改
              this.getList();
            });
          } else {
            addEquipment(submitData).then(response => {
              // 获取新创建的设备ID
              if (response.data && response.data.id) {
                this.form.id = response.data.id;
              }
              // 保存文件列表到后端
              this.saveDocumentFiles();
              this.$modal.msgSuccess("新增成功");
              // 不关闭对话框，继续修改
              this.getList();
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除设备信息编号为"' + ids + '"的数据项？').then(() => {
        return delEquipment(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 导出按钮操作 */
    handleExport() {
      this.$modal.msgSuccess("导出成功");
    },
    /** 打印列表按钮操作 */
    async handlePrintList() {
      // 检查是否有选中的行
      if (!this.ids || this.ids.length === 0) {
        this.$modal.msgWarning("请先选择要打印的设备");
        return;
      }

      const selectedIds = this.ids;
      const totalCount = selectedIds.length;

      // 显示加载提示
      this.$modal.loading(`正在准备打印 ${totalCount} 个设备卡片，请稍候...`);

      try {
        // 批量获取所有设备信息
        const equipmentDataList = [];

        for (let i = 0; i < selectedIds.length; i++) {
          const equipmentId = selectedIds[i];

          try {
            const response = await getEquipment(equipmentId);
            if (response.code === 200 && response.data) {
              equipmentDataList.push(response.data);
            } else {
              console.error(`获取设备 ${equipmentId} 信息失败:`, response.msg);
            }
          } catch (error) {
            console.error(`获取设备 ${equipmentId} 信息失败:`, error);
          }
        }

        if (equipmentDataList.length === 0) {
          this.$modal.closeLoading();
          this.$modal.msgError("未能获取到任何设备信息");
          return;
        }

        // 设置打印数据（包含多个设备）
        this.printAssetCardData = equipmentDataList.length === 1
          ? equipmentDataList[0]
          : { multiple: true, list: equipmentDataList };

        // 等待组件渲染后调用打印
        this.$nextTick(() => {
          this.$modal.closeLoading();
          if (this.$refs.assetCardPrintRefAuto) {
            this.$refs.assetCardPrintRefAuto.start();
          } else {
            this.$modal.msgError("打印组件未找到");
          }
        });

      } catch (error) {
        this.$modal.closeLoading();
        console.error('批量打印失败:', error);
        this.$modal.msgError("批量打印过程中出现错误");
      }
    },
    /** 打印按钮操作 */
    handlePrint(row) {
      var id = row.id || this.ids[0];
      this.queryParams.code = id;
      var sbLabelInfo = getSbLabelInfo(this.queryParams);
      if (!sbLabelInfo) {
        this.$modal.msgError("设备标签信息不存在或未找到");
        return;
      }
      this.$modal.msgSuccess("设备标签信息:"+sbLabelInfo);
      // this.$modal.loading("正在连接打印机，请稍候...");
      connectprinter();
      printlabel(sbLabelInfo);
      this.$modal.msgSuccess("打印成功");
    },
    /** 生成二维码URL */
    getQRCodeUrl(data) {
      if (!data) return '';
      // 使用在线QR码生成服务
      return `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(data)}`;
    },
    /** 打印资产卡片 */
    handlePrintAssetCard() {
      if (!this.form.assetCode) {
        this.$modal.msgWarning("请先保存设备信息");
        return;
      }
      // 设置打印数据
      this.printAssetCardData = { ...this.form };
      // 等待组件渲染后调用打印
      this.$nextTick(() => {
        if (this.$refs.assetCardPrintRefAuto) {
          this.$refs.assetCardPrintRefAuto.start();
        }
      });
    },
    /** 文档管理相关方法 */
    toggleTypeList() {
      this.typeListExpanded = !this.typeListExpanded;
    },
    handleDocumentSearch() {
      // 搜索文档
      this.loadDocumentList();
    },
    handleSelectFile() {
      // 选择文件
      if (this.$refs.documentFileInput) {
        this.$refs.documentFileInput.click();
      }
    },
    handleFileSelect(event) {
      // 处理文件选择
      const files = event.target.files;
      if (files && files.length > 0) {
        // 只取第一个文件
        const file = files[0];
        this.selectedUploadFile = file;
        console.log('选中的文件:', file);
        this.$modal.msgInfo(`已选择文件: ${file.name}`);
        // 重置input，以便可以重复选择相同文件
        event.target.value = '';
      }
    },
    async handleDocumentUpload() {
      // 上传文档
      if (!this.selectedUploadFile) {
        this.$modal.msgWarning("请先选择文件");
        return;
      }
      if (!this.selectedDocumentType) {
        this.$modal.msgWarning("请先选择文件类型");
        return;
      }
      if (!this.form.id) {
        this.$modal.msgWarning("请先保存设备信息");
        return;
      }

      try {
        // 创建FormData对象上传文件
        const formData = new FormData();
        formData.append('file', this.selectedUploadFile);

        // 上传文件到服务器
        // 使用axios直接上传，因为request工具会将FormData转换为JSON导致上传失败
        const uploadResponse = await axios({
          url: process.env.VUE_APP_BASE_API + '/common/upload',
          method: 'post',
          data: formData,
          headers: {
            'Authorization': 'Bearer ' + getToken(),
            'Content-Type': 'multipart/form-data'
          }
        });

        // 处理响应数据
        const responseData = uploadResponse.data;

        if (!responseData || responseData.code !== 200) {
          this.$modal.msgError(responseData?.msg || "文件上传失败");
          return;
        }

        // 后端返回的数据结构：{ code: 200, url: "...", fileName: "...", originalFilename: "..." }
        const fileInfo = {
          id: Date.now(),
          name: this.selectedUploadFile.name,
          type: this.selectedDocumentType,
          url: responseData.url || '',
          fileName: responseData.fileName || '',
          originalFilename: responseData.originalFilename || this.selectedUploadFile.name,
          equipmentId: this.form.id
        };

        // 验证必要字段
        if (!fileInfo.url) {
          console.error('上传响应数据:', uploadResponse);
          this.$modal.msgError("文件上传失败：无法获取文件URL");
          return;
        }

        // 添加到文件列表
        this.documentFileList.push(fileInfo);

        // 设置为预览文件
        this.previewFile = fileInfo;

        // 清空选择
        this.selectedUploadFile = null;

        this.$modal.msgSuccess("上传成功");
      } catch (error) {
        console.error('文件上传失败:', error);
        this.$modal.msgError("文件上传失败：" + (error.message || "未知错误"));
      }
    },
    /** 选择预览文件 */
    selectPreviewFile(file) {
      this.previewFile = file;
    },
    /** 获取文件类型标签 */
    getDocumentTypeLabel(typeValue) {
      const type = this.documentTypeList.find(t => t.value === typeValue);
      return type ? type.label : '';
    },
    handleDocumentDownload() {
      // 下载选中的文档
      if (this.documentSelectedFiles.length === 0) {
        this.$modal.msgWarning("请先选择要下载的文件");
        return;
      }
      // 下载选中的文件
      this.documentSelectedFiles.forEach(fileId => {
        const file = this.documentFileList.find(f => f.id === fileId);
        if (file && file.url) {
          const link = document.createElement('a');
          link.href = file.url;
          link.download = file.name || 'download';
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      });
      this.$modal.msgSuccess("下载成功");
    },
    handleDocumentCopy() {
      // 复制到其他位置
      if (this.documentSelectedFiles.length === 0) {
        this.$modal.msgWarning("请先选择要复制的文件");
        return;
      }
      this.$modal.msgSuccess("复制功能待实现");
    },
    handleDocumentDelete() {
      // 删除选中的文档
      if (this.documentSelectedFiles.length === 0) {
        this.$modal.msgWarning("请先选择要删除的文件");
        return;
      }
      this.$modal.confirm('确定要删除选中的文件吗？').then(() => {
        // 删除逻辑
        this.documentFileList = this.documentFileList.filter(file => !this.documentSelectedFiles.includes(file.id));
        this.documentSelectedFiles = [];
        this.previewFile = null;
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    handleDocumentPreview() {
      // 预览图片
      if (this.documentSelectedFiles.length !== 1) {
        this.$modal.msgWarning("请选择一个文件进行预览");
        return;
      }
      const fileId = this.documentSelectedFiles[0];
      this.previewFile = this.documentFileList.find(file => file.id === fileId);
    },
    isFileSelected(file) {
      // 判断文件是否被选中
      if (!file || !file.id) return false;
      return this.documentSelectedFiles.includes(file.id);
    },
    toggleFileSelection(file) {
      // 切换文件选择状态（单选模式：点击文件时选中该文件，取消其他选中）
      const fileId = file && file.id ? file.id : file;
      const fileObj = typeof file === 'object' ? file : this.documentFileList.find(f => f.id === fileId);

      // 如果点击的是已选中的文件，取消选中；否则选中该文件（单选）
      if (this.documentSelectedFiles.includes(fileId)) {
        this.documentSelectedFiles = [];
        if (this.previewFile && this.previewFile.id === fileId) {
          this.previewFile = null;
        }
      } else {
        // 单选模式：只选中当前文件
        this.documentSelectedFiles = [fileId];
        // 自动预览选中的文件（图片或PDF）
        if (fileObj && (this.isImageFile(fileObj) || this.isPdfFile(fileObj))) {
          this.previewFile = fileObj;
        }
      }
    },
    isPdfFile(file) {
      // 判断是否为PDF文件
      if (!file || !file.name) return false;
      const fileName = file.name.toLowerCase();
      return fileName.endsWith('.pdf');
    },
    getFileIcon(file) {
      // 根据文件类型返回图标
      if (this.isImageFile(file)) {
        return 'el-icon-picture';
      } else if (this.isPdfFile(file)) {
        return 'el-icon-document';
      } else {
        return 'el-icon-document';
      }
    },
    handleFileItemClick(file) {
      // 点击文件项：选中文件并预览
      this.toggleFileSelection(file);
      this.selectPreviewFile(file);
    },
    isImageFile(file) {
      // 判断是否为图片文件
      if (!file || !file.name) return false;
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
      const fileName = file.name.toLowerCase();
      return imageExtensions.some(ext => fileName.endsWith(ext));
    },
    async loadDocumentList() {
      // 加载文档列表（根据设备ID获取）
      if (!this.form.id) {
        this.documentFileList = [];
        return;
      }

      try {
        // 调用API获取设备文件列表
        const response = await listEquipmentFile({
          equipmentId: this.form.id
        });

        if (response.code === 200 && response.rows) {
          // 转换后端数据格式为前端格式
          this.documentFileList = response.rows.map(file => ({
            id: file.fileId || file.id,
            name: file.originalFilename || file.fileName,
            type: file.documentType || file.type,
            url: file.url || file.fileUrl,
            fileName: file.fileName,
            originalFilename: file.originalFilename,
            equipmentId: file.equipmentId,
            fileId: file.fileId || file.id
          }));
        } else {
          this.documentFileList = [];
        }
      } catch (error) {
        console.error('加载文档列表失败:', error);
        this.documentFileList = [];
      }
    },
    async saveDocumentFiles() {
      // 保存文件列表到后端
      if (!this.form.id || !this.documentFileList || this.documentFileList.length === 0) {
        return;
      }

      try {
        // 遍历文件列表，保存每个文件信息
        for (const file of this.documentFileList) {
          // 如果文件已经有fileId，说明已保存过，跳过
          if (file.fileId) {
            continue;
          }

          // 调用API保存文件信息
          await addEquipmentFile({
            equipmentId: this.form.id,
            documentType: file.type,
            fileName: file.fileName,
            originalFilename: file.originalFilename || file.name,
            filePath: file.url,
            url: file.url
          });
        }
      } catch (error) {
        console.error('保存文件列表失败:', error);
        // 不显示错误，避免影响主流程
      }
    },
    /** 双击图片查看 */
    handleImageDoubleClick() {
      if (this.previewFile && this.isImageFile(this.previewFile)) {
        this.viewerImageUrl = this.previewFile.url;
        this.imageViewerVisible = true;
        this.imageScale = 1;
        this.imagePosition = { x: 0, y: 0 };
      }
    },
    /** 图片查看器关闭 */
    handleImageViewerClose() {
      this.imageViewerVisible = false;
      this.resetImageScale();
    },
    /** 重置图片缩放 */
    resetImageScale() {
      this.imageScale = 1;
      this.imagePosition = { x: 0, y: 0 };
      this.$nextTick(() => {
        if (this.$refs.viewerImage) {
          this.$refs.viewerImage.style.transform = `scale(1) translate(0px, 0px)`;
        }
      });
    },
    /** 放大图片 */
    zoomIn() {
      this.imageScale = Math.min(this.imageScale + 0.1, 5);
    },
    /** 缩小图片 */
    zoomOut() {
      this.imageScale = Math.max(this.imageScale - 0.1, 0.1);
    },
    /** 鼠标滚轮缩放 */
    handleImageWheel(event) {
      const delta = event.deltaY > 0 ? -0.1 : 0.1;
      this.imageScale = Math.max(0.1, Math.min(5, this.imageScale + delta));
    },
    /** 鼠标按下开始拖拽 */
    handleImageMouseDown(event) {
      if (this.imageScale > 1) {
        this.isDragging = true;
        this.dragStart = {
          x: event.clientX - this.imagePosition.x,
          y: event.clientY - this.imagePosition.y
        };
      }
    },
    /** 鼠标移动拖拽 */
    handleImageMouseMove(event) {
      if (this.isDragging) {
        this.imagePosition = {
          x: event.clientX - this.dragStart.x,
          y: event.clientY - this.dragStart.y
        };
      }
    },
    /** 鼠标释放停止拖拽 */
    handleImageMouseUp() {
      this.isDragging = false;
    }
  },
  watch: {
    imageScale(newVal) {
      this.$nextTick(() => {
        if (this.$refs.viewerImage) {
          this.$refs.viewerImage.style.transform = `scale(${newVal}) translate(${this.imagePosition.x}px, ${this.imagePosition.y}px)`;
        }
      });
    }
  }
};
</script>

<style scoped>
.app-container {
  padding: 20px;
}

.mb8 {
  margin-bottom: 8px;
}

/* 调整右侧工具栏搜索框高度，与其他按钮保持一致 */
.mb8 ::v-deep .right-toolbar .el-input__inner {
  height: 32px;
  line-height: 32px;
}

.mb8 ::v-deep .right-toolbar .el-input {
  height: 32px;
}

/* 调整仓库库存查询时的搜索框高度，与科室库存保持一致 */
.search-form ::v-deep .el-input__inner {
  height: 32px;
  line-height: 32px;
}

.search-form ::v-deep .el-input {
  height: 32px;
}

.search-form ::v-deep .el-select .el-input__inner {
  height: 32px;
  line-height: 32px;
}

.search-form ::v-deep .el-date-editor .el-input__inner {
  height: 32px;
  line-height: 32px;
}

/* 降低仓库库存查询时搜索表单容器的高度 */
.search-form ::v-deep .el-form-item {
  margin-bottom: 16px;
}

.search-form ::v-deep .el-row {
  margin-bottom: 0;
}


.el-tabs {
  margin-top: 20px;
}

.el-form-item {
  margin-bottom: 20px;
}

.el-checkbox-group {
  display: flex;
  flex-wrap: wrap;
}

.el-checkbox {
  margin-right: 20px;
  margin-bottom: 10px;
}

.local-modal-mask {
  position: absolute;
  left: 0; top: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.3);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}
 .local-modal-content {
   background: #fff;
   border-radius: 6px;
   width: 98vw;
   min-width: 1600px;
   max-width: 98vw;
   height: 92vh;
   max-height: 92vh;
   display: flex;
   flex-direction: column;
   padding: 0;
   box-shadow: 0 2px 8px rgba(0,0,0,0.2);
 }

.local-modal-content .modal-header-fixed {
  flex-shrink: 0;
  padding: 24px 24px 16px 24px;
  background: #fff;
  border-bottom: 1px solid #EBEEF5;
}

.local-modal-content .equipment-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0 24px;
}

.local-modal-content .equipment-tabs ::v-deep .el-tabs__header {
  flex-shrink: 0;
  margin: 0;
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 10;
  padding: 0;
  border-bottom: 1px solid #EBEEF5;
}

.local-modal-content .equipment-tabs ::v-deep .el-tabs__content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-top: 20px;
  padding-bottom: 20px;
  /* 隐藏滚动条但保持滚动功能 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 和 Edge */
}

.local-modal-content .equipment-tabs ::v-deep .el-tabs__content::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

/* 文档管理子标签页样式 */
.local-modal-content .document-sub-tabs {
  margin-top: -15px;
}

.local-modal-content .document-sub-tabs ::v-deep .el-tabs__header {
  margin-bottom: 8px;
}

.local-modal-content .document-sub-tabs ::v-deep .el-tabs__content {
  padding-top: 5px;
}

/* 文档管理页面样式 */
.document-management-container {
  padding: 15px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.document-toolbar {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  flex-wrap: wrap;
  gap: 10px;
}

.document-content {
  display: flex;
  flex: 1;
  gap: 15px;
  min-height: 0;
}

.document-type-list {
  width: 200px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
}

.type-list-header {
  padding: 12px 15px;
  background: #f5f7fa;
  border-bottom: 1px solid #dcdfe6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
  cursor: pointer;
}

.type-list-header i {
  font-size: 14px;
  color: #909399;
}

.type-list-content {
  overflow-y: auto;
  overflow-x: hidden;
  padding: 10px;
  height: 500px;
  max-height: 500px;
  min-height: 300px;
}

.type-item-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}

.type-item {
  padding: 8px 0;
  font-size: 14px;
  white-space: nowrap;
  width: 100%;
  flex-shrink: 0;
}

.document-main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
}

.empty-text {
  font-size: 16px;
  margin-bottom: 20px;
}

.empty-preview {
  width: 100%;
  height: 400px;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
}

.file-list-container {
  flex: 1;
  display: flex;
  gap: 15px;
  min-height: 0;
}

.file-list {
  width: 300px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  overflow-y: auto;
  padding: 10px;
}

.file-item {
  padding: 10px;
  margin-bottom: 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s;
}

.file-item:hover {
  background: #f5f7fa;
  border-color: #409eff;
}

.file-item.selected {
  background: #ecf5ff;
  border-color: #409eff;
}

.file-name {
  flex: 1;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-area {
  flex: 1;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  background: #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.preview-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.preview-placeholder {
  color: #909399;
  font-size: 14px;
  text-align: center;
}

/* 文件预览框样式 */
/* 文件列表框样式 */
.document-file-list-box {
  width: 250px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
  max-height: 500px;
}

.file-list-header {
  padding: 12px 15px;
  background: #f5f7fa;
  border-bottom: 1px solid #dcdfe6;
  font-weight: 500;
  font-size: 14px;
  color: #606266;
}

.file-type-content {
  padding: 10px;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
}

.file-type-item-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-type-radio {
  margin-right: 0;
  margin-bottom: 0;
  white-space: nowrap;
  display: block;
  line-height: 28px;
}

.file-list-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.file-list-item {
  padding: 10px;
  margin-bottom: 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.3s;
}

.file-list-item:hover {
  background: #f5f7fa;
  border-color: #409eff;
}

.file-list-item.active {
  background: #ecf5ff;
  border-color: #409eff;
}

.file-list-item.selected {
  background: #ecf5ff;
  border-color: #409eff;
}

.file-list-item.active.selected {
  background: #ecf5ff;
  border-color: #409eff;
}

.file-list-name {
  flex: 1;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-list-empty {
  text-align: center;
  color: #909399;
  font-size: 14px;
  padding: 20px;
}

/* 文件预览框样式 */
.image-preview-box {
  flex: 1;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
  max-height: 500px;
}

.preview-box-header {
  padding: 12px 15px;
  background: #f5f7fa;
  border-bottom: 1px solid #dcdfe6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
  font-size: 14px;
  color: #606266;
  flex-shrink: 0;
}

.preview-header-actions {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.preview-box-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: auto;
  max-height: calc(500px - 50px);
}

.preview-image-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image-full {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.preview-pdf-iframe {
  width: 100%;
  height: 100%;
  min-height: 400px;
  border: none;
}

.preview-placeholder-box {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.preview-placeholder-text {
  color: #909399;
  font-size: 14px;
  text-align: center;
}

.preview-file-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.preview-file-name {
  font-size: 16px;
  color: #606266;
  margin-bottom: 8px;
  word-break: break-all;
  text-align: center;
}

.preview-file-type {
  font-size: 14px;
  color: #909399;
}

/* 图片查看器样式 */
.image-viewer-dialog {
  max-width: 95vw;
}

.image-viewer-dialog ::v-deep .el-dialog__body {
  padding: 20px;
  overflow: hidden;
}

.image-viewer-container {
  width: 100%;
  height: 70vh;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  cursor: move;
}

.viewer-image {
  max-width: none;
  max-height: none;
  user-select: none;
  transition: transform 0.1s ease-out;
}

.dialog-footer {
  display: flex;
  align-items: center;
  gap: 10px;
}

.scale-info {
  margin-left: auto;
  color: #606266;
  font-size: 14px;
}

.preview-image-wrapper {
  cursor: pointer;
}

/* 文件类型框样式 */
.document-file-type-box {
  width: 250px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
  max-height: 500px;
}

/* 文件列表框样式 */
.document-file-list-box {
  width: 200px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
  max-height: 500px;
}

.file-list-header {
  padding: 12px 15px;
  background: #f5f7fa;
  border-bottom: 1px solid #dcdfe6;
  font-weight: 500;
  font-size: 14px;
  color: #606266;
}

.file-type-content {
  padding: 10px;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
}

.file-type-item-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-type-radio {
  margin-right: 0;
  margin-bottom: 0;
  white-space: nowrap;
  display: block;
  line-height: 28px;
}

.file-list-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.file-list-item {
  padding: 10px;
  margin-bottom: 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.3s;
}

.file-list-item:hover {
  background: #f5f7fa;
  border-color: #409eff;
}

.file-list-item.active {
  background: #ecf5ff;
  border-color: #409eff;
}

.file-list-item.selected {
  background: #ecf5ff;
  border-color: #409eff;
}

.file-list-item.active.selected {
  background: #ecf5ff;
  border-color: #409eff;
}

.file-list-name {
  flex: 1;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-list-empty {
  text-align: center;
  color: #909399;
  font-size: 14px;
  padding: 20px;
}


.local-modal-content .dialog-footer {
  flex-shrink: 0;
  padding: 16px 24px;
  border-top: 1px solid #EBEEF5;
  background: #fff;
  text-align: center;
  position: sticky;
  bottom: 0;
  z-index: 10;
}

.local-modal-content .dialog-footer-center {
  flex-shrink: 0;
  padding: 16px 24px;
  border-top: 1px solid #EBEEF5;
  background: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  position: sticky;
  bottom: 0;
  z-index: 10;
}

/* 表格样式优化 */
.el-table {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

/* 68分类树样式 */
.tree-card {
  margin-right: 15px;
  height: calc(100vh - 180px);
  display: flex;
  flex-direction: column;
}

.tree-card ::v-deep .el-card__header {
  padding: 18px 20px;
  border-bottom: 1px solid #EBEEF5;
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 10;
  flex-shrink: 0;
}

.tree-card ::v-deep .el-card__body {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.tree-header {
  font-weight: bold;
  font-size: 14px;
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  font-size: 14px;
  padding: 3px 0;
}

.custom-tree-node i {
  margin-right: 5px;
}

.el-tree {
  background: transparent;
  padding: 10px;
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

/* 按钮样式 */
.el-button--text {
  padding: 0 4px;
}

.el-button--text:hover {
  color: #409EFF;
}

/* 搜索区域样式 */
.search-form {
  background: #fff;
  padding: 15px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

.search-form .el-form-item {
  margin-bottom: 10px;
}

/* 随机资料容器样式 */
.random-materials-container,
.additional-container,
.maintenance-container,
.detail-container {
  background: #fafafa;
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  padding: 16px;
  margin-top: 20px;
  margin-bottom: 20px;
}

.container-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #EBEEF5;
}

.container-content {
  min-height: 100px;
  color: #606266;
}

.container-content .el-form-item {
  margin-bottom: 0;
}

.container-content .el-checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.container-content .el-checkbox {
  margin-right: 0;
}

/* 明细表格高度 */
.contract-detail-table {
  min-height: 400px;
}

.contract-detail-table ::v-deep .el-table__body-wrapper {
  min-height: 350px;
}

/* 所有输入框不换行 */
.local-modal-content .el-input__inner,
.local-modal-content .el-textarea__inner,
.local-modal-content .el-input-number__input {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.local-modal-content .el-textarea__inner {
  white-space: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
  resize: none;
}

/* 图片上传样式 */
.image-uploader {
  display: inline-block;
}

.image-uploader ::v-deep .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 100px;
  height: 100px;
}

.image-uploader ::v-deep .el-upload:hover {
  border-color: #409EFF;
}

.image-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  line-height: 100px;
  text-align: center;
}

.image-preview {
  width: 100px;
  height: 100px;
  display: block;
  object-fit: cover;
}

/* 资产卡片样式 */
.asset-card-container {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.asset-card-header {
  margin-bottom: 15px;
  width: 100%;
}

.asset-card {
  width: 100%;
  max-width: 800px;
  border: 2px solid #000;
  background: #fff;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.asset-card-title {
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  padding-bottom: 15px;
  border-bottom: 2px solid #000;
  margin-bottom: 15px;
}

.asset-card-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.asset-card-info {
  flex: 1;
  padding-right: 20px;
}

.asset-card-row {
  display: flex;
  margin-bottom: 12px;
  align-items: flex-start;
}

.asset-card-label {
  width: 100px;
  font-weight: 500;
  color: #333;
  flex-shrink: 0;
}

.asset-card-value {
  flex: 1;
  color: #666;
  word-break: break-word;
}

.asset-card-qrcode {
  width: 120px;
  height: 120px;
  border: 1px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: #fff;
}

.qrcode-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.asset-card-empty {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 14px;
}

/* 设备图片容器样式 */
.device-image-container {
  padding: 15px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.device-image-toolbar {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  flex-wrap: wrap;
  gap: 10px;
  padding-bottom: 15px;
  border-bottom: 1px solid #EBEEF5;
}

.device-image-gallery {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.image-item {
  position: relative;
  cursor: pointer;
  border: 2px solid transparent;
  border-radius: 4px;
  overflow: hidden;
  transition: all 0.3s;
}

.image-item:hover {
  border-color: #409EFF;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.image-item.selected {
  border-color: #409EFF;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.5);
}

.image-wrapper {
  position: relative;
  width: 100%;
  padding-top: 75%; /* 4:3 比例 */
  background: #f5f7fa;
  min-height: 250px;
}

.image-wrapper img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
  padding: 10px;
  color: #fff;
  opacity: 0;
  transition: opacity 0.3s;
}

.image-item:hover .image-overlay {
  opacity: 1;
}

.image-info {
  font-size: 12px;
}

.image-date {
  margin-bottom: 4px;
}

.image-uploader {
  font-size: 11px;
  opacity: 0.9;
}

.image-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #909399;
}

.preview-image-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.preview-image-full {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

.device-image-preview-dialog ::v-deep .el-dialog__body {
  padding: 20px;
  text-align: center;
}
</style>
