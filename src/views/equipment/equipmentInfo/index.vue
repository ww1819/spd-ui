<template>
  <div class="app-container">
    <el-row :gutter="20">
      <!-- 左侧68分类树 -->
      <el-col :span="6">
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
      <el-col :span="18">
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
      </el-row>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="3">
        <el-radio-group v-model="switchValue" @change="handleSwitchChange" size="small" style="display: flex;">
          <el-radio-button label="全部">全部</el-radio-button>
          <el-radio-button label="科室">科室</el-radio-button>
          <el-radio-button label="仓库">仓库</el-radio-button>
        </el-radio-group>
      </el-col>
      <el-col :span="1.5">
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
      <el-table-column label="档案编码" align="center" prop="assetCode" width="100" show-overflow-tooltip/>
      <el-table-column label="档案名称" align="center" prop="assetName" width="180" show-overflow-tooltip/>
      <el-table-column label="规格" align="center" prop="specification" width="100" show-overflow-tooltip/>
      <el-table-column label="型号" align="center" prop="model" width="100" show-overflow-tooltip/>
      <el-table-column label="使用科室" align="center" prop="useDepartment" width="100" show-overflow-tooltip>
        <template slot-scope="scope">
          <span>{{ getDepartmentName(scope.row.useDepartment) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="管理科室" align="center" prop="manageDepartment" width="100" show-overflow-tooltip>
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
      <el-table-column label="资产序列号" align="center" prop="serialNumber" width="150" show-overflow-tooltip/>
      <el-table-column label="价格" align="center" prop="barcode" width="100" show-overflow-tooltip/>
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
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="80" fixed="right">
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
                    placeholder="请选择资产分类后自动生成"
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
                <el-form-item label="价格/元：" prop="barcode">
                  <el-input v-model="form.barcode"></el-input>
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
                  <el-input v-model="form.supplier" placeholder="请输入供应商"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item label="生产厂家：" prop="factoryId">
                  <el-input v-model="form.factoryId" placeholder="请输入生产厂家"></el-input>
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
              <el-col :span="4">
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
              <el-col :span="4">
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
                <el-form-item label="资产分类：" prop="assetType">
                  <el-select 
                    v-model="form.assetType" 
                    placeholder="请选择资产分类" 
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
          <el-form ref="form" :model="form" label-width="120px">
            <!-- 明细表格 -->
            <el-row :gutter="20">
              <el-col :span="24">
                <el-table
                  :data="form.assetCardList"
                  border
                  class="contract-detail-table"
                  style="width: 100%"
                  :header-cell-style="{ background: '#f5f7fa', color: '#606266' }">
                  <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
                  <el-table-column prop="imageUrl" label="预览" width="200" align="center">
                    <template slot-scope="scope">
                      <el-upload
                        class="image-uploader"
                        :action="uploadImageUrl"
                        :show-file-list="false"
                        :headers="uploadImageHeaders"
                        :on-success="(response, file) => handleAssetCardImageSuccess(response, file, scope.$index)"
                        :before-upload="beforeImageUpload">
                        <img v-if="scope.row.imageUrl" :src="scope.row.imageUrl" class="image-preview" />
                        <i v-else class="el-icon-plus image-uploader-icon"></i>
                      </el-upload>
                    </template>
                  </el-table-column>
                </el-table>
              </el-col>
            </el-row>
          </el-form>
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
          <el-tabs v-model="documentActiveTab" type="card" class="document-sub-tabs">
            <!-- 购置审批 -->
            <el-tab-pane label="购置审批" name="purchaseApproval">
          <el-form ref="form" :model="form" label-width="120px">
            <el-row :gutter="20">
                  <el-col :span="24">
                    <el-form-item label="购置审批：">
                      <el-input v-model="form.purchaseApproval" type="textarea" :rows="6" placeholder="请输入购置审批信息"></el-input>
                </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </el-tab-pane>

            <!-- 合同书 -->
            <el-tab-pane label="合同书" name="contractDocument">
              <el-form ref="form" :model="form" label-width="120px">
                <el-row :gutter="20">
                  <el-col :span="24">
                    <el-form-item label="合同书：">
                      <el-input v-model="form.contractDocument" type="textarea" :rows="6" placeholder="请输入合同书信息"></el-input>
                </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </el-tab-pane>

            <!-- 验收报告(合格证) -->
            <el-tab-pane label="验收报告(合格证)" name="acceptanceReport">
              <el-form ref="form" :model="form" label-width="120px">
                <el-row :gutter="20">
                  <el-col :span="24">
                    <el-form-item label="验收报告(合格证)：">
                      <el-input v-model="form.acceptanceReport" type="textarea" :rows="6" placeholder="请输入验收报告(合格证)信息"></el-input>
                </el-form-item>
              </el-col>
                </el-row>
              </el-form>
            </el-tab-pane>

            <!-- 发票 -->
            <el-tab-pane label="发票" name="invoice">
              <el-form ref="form" :model="form" label-width="120px">
                <el-row :gutter="20">
                  <el-col :span="24">
                    <el-form-item label="发票：">
                      <el-input v-model="form.invoice" type="textarea" :rows="6" placeholder="请输入发票信息"></el-input>
                </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </el-tab-pane>

            <!-- 证件 -->
            <el-tab-pane label="证件" name="certificate">
              <el-form ref="form" :model="form" label-width="120px">
                <el-row :gutter="20">
                  <el-col :span="24">
                    <el-form-item label="证件：">
                      <el-input v-model="form.certificate" type="textarea" :rows="6" placeholder="请输入证件信息"></el-input>
                </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </el-tab-pane>

            <!-- 说明书 -->
            <el-tab-pane label="说明书" name="manual">
              <el-form ref="form" :model="form" label-width="120px">
                <el-row :gutter="20">
                  <el-col :span="24">
                    <el-form-item label="说明书：">
                      <el-input v-model="form.manual" type="textarea" :rows="6" placeholder="请输入说明书信息"></el-input>
                </el-form-item>
              </el-col>
            </el-row>
              </el-form>
            </el-tab-pane>

            <!-- 计量检定合格证 -->
            <el-tab-pane label="计量检定合格证" name="measurementCertificate">
              <el-form ref="form" :model="form" label-width="120px">
            <el-row :gutter="20">
                  <el-col :span="24">
                    <el-form-item label="计量检定合格证：">
                      <el-input v-model="form.measurementCertificate" type="textarea" :rows="6" placeholder="请输入计量检定合格证信息"></el-input>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

            <!-- 安全检验合格证 -->
            <el-tab-pane label="安全检验合格证" name="safetyCertificate">
          <el-form ref="form" :model="form" label-width="120px">
            <el-row :gutter="20">
                  <el-col :span="24">
                    <el-form-item label="安全检验合格证：">
                      <el-input v-model="form.safetyCertificate" type="textarea" :rows="6" placeholder="请输入安全检验合格证信息"></el-input>
                </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </el-tab-pane>

            <!-- 放射检测报告 -->
            <el-tab-pane label="放射检测报告" name="radiationReport">
              <el-form ref="form" :model="form" label-width="120px">
                <el-row :gutter="20">
                  <el-col :span="24">
                    <el-form-item label="放射检测报告：">
                      <el-input v-model="form.radiationReport" type="textarea" :rows="6" placeholder="请输入放射检测报告信息"></el-input>
                </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </el-tab-pane>

            <!-- 维修单 -->
            <el-tab-pane label="维修单" name="repairOrder">
              <el-form ref="form" :model="form" label-width="120px">
                <el-row :gutter="20">
                  <el-col :span="24">
                    <el-form-item label="维修单：">
                      <el-input v-model="form.repairOrder" type="textarea" :rows="6" placeholder="请输入维修单信息"></el-input>
                </el-form-item>
              </el-col>
                </el-row>
              </el-form>
            </el-tab-pane>

            <!-- 合同附件 -->
            <el-tab-pane label="合同附件" name="contractAttachment">
              <el-form ref="form" :model="form" label-width="120px">
                <el-row :gutter="20">
                  <el-col :span="24">
                    <el-form-item label="合同附件：">
                      <el-input v-model="form.contractAttachment" type="textarea" :rows="6" placeholder="请输入合同附件信息"></el-input>
                </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </el-tab-pane>

            <!-- 巡检图片 -->
            <el-tab-pane label="巡检图片" name="inspectionImage">
              <el-form ref="form" :model="form" label-width="120px">
                <el-row :gutter="20">
                  <el-col :span="24">
                    <el-form-item label="巡检图片：">
                      <el-input v-model="form.inspectionImage" type="textarea" :rows="6" placeholder="请输入巡检图片信息"></el-input>
                </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </el-tab-pane>

            <!-- 保养图片 -->
            <el-tab-pane label="保养图片" name="maintenanceImage">
              <el-form ref="form" :model="form" label-width="120px">
                <el-row :gutter="20">
                  <el-col :span="24">
                    <el-form-item label="保养图片：">
                      <el-input v-model="form.maintenanceImage" type="textarea" :rows="6" placeholder="请输入保养图片信息"></el-input>
                </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </el-tab-pane>

            <!-- 质控图片 -->
            <el-tab-pane label="质控图片" name="qualityControlImage">
              <el-form ref="form" :model="form" label-width="120px">
                <el-row :gutter="20">
                  <el-col :span="24">
                    <el-form-item label="质控图片：">
                      <el-input v-model="form.qualityControlImage" type="textarea" :rows="6" placeholder="请输入质控图片信息"></el-input>
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </el-tab-pane>

            <!-- 报关文件 -->
            <el-tab-pane label="报关文件" name="customsDocument">
              <el-form ref="form" :model="form" label-width="120px">
                <el-row :gutter="20">
                  <el-col :span="24">
                    <el-form-item label="报关文件：">
                      <el-input v-model="form.customsDocument" type="textarea" :rows="6" placeholder="请输入报关文件信息"></el-input>
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </el-tab-pane>

            <!-- 商检资质 -->
            <el-tab-pane label="商检资质" name="inspectionQualification">
              <el-form ref="form" :model="form" label-width="120px">
                <el-row :gutter="20">
                  <el-col :span="24">
                    <el-form-item label="商检资质：">
                      <el-input v-model="form.inspectionQualification" type="textarea" :rows="6" placeholder="请输入商检资质信息"></el-input>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>
      </el-tabs>
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
          <el-form ref="form" :model="form" label-width="120px">
            <!-- 明细表格 -->
            <el-row :gutter="20">
              <el-col :span="24">
                <el-table
                  :data="form.deviceImageList"
                  border
                  class="contract-detail-table"
                  style="width: 100%"
                  :header-cell-style="{ background: '#f5f7fa', color: '#606266' }">
                  <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
                  <el-table-column prop="uploadDate" label="上传日期" width="150" align="center">
                    <template slot-scope="scope">
                      <el-date-picker v-model="scope.row.uploadDate" type="date" style="width:100%" placeholder="请选择上传日期"></el-date-picker>
                    </template>
                  </el-table-column>
                  <el-table-column prop="uploadPerson" label="上传人" width="150" align="center">
                    <template slot-scope="scope">
                      <el-select v-model="scope.row.uploadPerson" style="width:100%" placeholder="请选择上传人" filterable>
                        <el-option
                          v-for="user in userOptions"
                          :key="user.id"
                          :label="user.name"
                          :value="user.id">
                        </el-option>
                      </el-select>
                    </template>
                  </el-table-column>
                  <el-table-column prop="imageUrl" label="预览" width="200" align="center">
                    <template slot-scope="scope">
                      <el-upload
                        class="image-uploader"
                        :action="uploadImageUrl"
                        :show-file-list="false"
                        :headers="uploadImageHeaders"
                        :on-success="(response, file) => handleImageSuccess(response, file, scope.$index)"
                        :before-upload="beforeImageUpload">
                        <img v-if="scope.row.imageUrl" :src="scope.row.imageUrl" class="image-preview" />
                        <i v-else class="el-icon-plus image-uploader-icon"></i>
                      </el-upload>
                    </template>
                  </el-table-column>
                </el-table>
              </el-col>
            </el-row>
          </el-form>
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
                  <el-table-column prop="useDepartment" label="使用科室" width="150" align="center">
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
                  <el-table-column prop="serialNumber" label="序列号" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.serialNumber" placeholder="请输入序列号"></el-input>
                    </template>
                  </el-table-column>
                  <el-table-column prop="category" label="类别" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.category" placeholder="请输入类别"></el-input>
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
        <div class="dialog-footer">
          <el-button @click="cancel">取 消</el-button>
          <el-button type="primary" @click="submitForm">保 存</el-button>
        </div>
      </div>
    </div>

    <!-- 查看详情对话框 -->
    <div v-if="viewOpen" class="local-modal-mask">
      <div class="local-modal-content">
        <div class="modal-header-fixed">
          <div style="font-size:18px;font-weight:bold;margin-bottom:16px;">查看设备信息详情</div>
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
              <el-col :span="4">
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
              <el-col :span="4">
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
                <el-form-item label="资产分类：">
                  <el-select 
                    v-model="form.assetType" 
                    placeholder="请选择资产分类" 
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
          <el-form ref="viewForm" :model="form" label-width="120px">
            <!-- 明细表格 -->
            <el-row :gutter="20">
              <el-col :span="24">
                <el-table
                  :data="form.assetCardList"
                  border
                  class="contract-detail-table"
                  style="width: 100%"
                  :header-cell-style="{ background: '#f5f7fa', color: '#606266' }">
                  <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
                  <el-table-column prop="imageUrl" label="预览" width="200" align="center">
                    <template slot-scope="scope">
                      <el-image
                        v-if="scope.row.imageUrl"
                        :src="scope.row.imageUrl"
                        class="image-preview-wrapper"
                        :preview-src-list="[scope.row.imageUrl]"
                        fit="cover">
                      </el-image>
                      <span v-else>暂无图片</span>
                    </template>
                  </el-table-column>
                </el-table>
              </el-col>
            </el-row>
          </el-form>
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
          <el-tabs v-model="documentActiveTab" type="card" class="document-sub-tabs">
            <!-- 购置审批 -->
            <el-tab-pane label="购置审批" name="purchaseApproval">
          <el-form ref="viewForm" :model="form" label-width="120px">
            <el-row :gutter="20">
                  <el-col :span="24">
                    <el-form-item label="购置审批：">
                      <el-input v-model="form.purchaseApproval" type="textarea" :rows="6" :disabled="true" placeholder="暂无购置审批信息"></el-input>
                </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </el-tab-pane>

            <!-- 合同书 -->
            <el-tab-pane label="合同书" name="contractDocument">
              <el-form ref="viewForm" :model="form" label-width="120px">
                <el-row :gutter="20">
                  <el-col :span="24">
                    <el-form-item label="合同书：">
                      <el-input v-model="form.contractDocument" type="textarea" :rows="6" :disabled="true" placeholder="暂无合同书信息"></el-input>
                </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </el-tab-pane>

            <!-- 验收报告(合格证) -->
            <el-tab-pane label="验收报告(合格证)" name="acceptanceReport">
              <el-form ref="viewForm" :model="form" label-width="120px">
                <el-row :gutter="20">
                  <el-col :span="24">
                    <el-form-item label="验收报告(合格证)：">
                      <el-input v-model="form.acceptanceReport" type="textarea" :rows="6" :disabled="true" placeholder="暂无验收报告(合格证)信息"></el-input>
                </el-form-item>
              </el-col>
                </el-row>
              </el-form>
            </el-tab-pane>

            <!-- 发票 -->
            <el-tab-pane label="发票" name="invoice">
              <el-form ref="viewForm" :model="form" label-width="120px">
                <el-row :gutter="20">
                  <el-col :span="24">
                    <el-form-item label="发票：">
                      <el-input v-model="form.invoice" type="textarea" :rows="6" :disabled="true" placeholder="暂无发票信息"></el-input>
                </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </el-tab-pane>

            <!-- 证件 -->
            <el-tab-pane label="证件" name="certificate">
              <el-form ref="viewForm" :model="form" label-width="120px">
                <el-row :gutter="20">
                  <el-col :span="24">
                    <el-form-item label="证件：">
                      <el-input v-model="form.certificate" type="textarea" :rows="6" :disabled="true" placeholder="暂无证件信息"></el-input>
                </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </el-tab-pane>

            <!-- 说明书 -->
            <el-tab-pane label="说明书" name="manual">
              <el-form ref="viewForm" :model="form" label-width="120px">
                <el-row :gutter="20">
                  <el-col :span="24">
                    <el-form-item label="说明书：">
                      <el-input v-model="form.manual" type="textarea" :rows="6" :disabled="true" placeholder="暂无说明书信息"></el-input>
                </el-form-item>
              </el-col>
            </el-row>
              </el-form>
            </el-tab-pane>

            <!-- 计量检定合格证 -->
            <el-tab-pane label="计量检定合格证" name="measurementCertificate">
              <el-form ref="viewForm" :model="form" label-width="120px">
            <el-row :gutter="20">
                  <el-col :span="24">
                    <el-form-item label="计量检定合格证：">
                      <el-input v-model="form.measurementCertificate" type="textarea" :rows="6" :disabled="true" placeholder="暂无计量检定合格证信息"></el-input>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

            <!-- 安全检验合格证 -->
            <el-tab-pane label="安全检验合格证" name="safetyCertificate">
          <el-form ref="viewForm" :model="form" label-width="120px">
            <el-row :gutter="20">
                  <el-col :span="24">
                    <el-form-item label="安全检验合格证：">
                      <el-input v-model="form.safetyCertificate" type="textarea" :rows="6" :disabled="true" placeholder="暂无安全检验合格证信息"></el-input>
                </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </el-tab-pane>

            <!-- 放射检测报告 -->
            <el-tab-pane label="放射检测报告" name="radiationReport">
              <el-form ref="viewForm" :model="form" label-width="120px">
                <el-row :gutter="20">
                  <el-col :span="24">
                    <el-form-item label="放射检测报告：">
                      <el-input v-model="form.radiationReport" type="textarea" :rows="6" :disabled="true" placeholder="暂无放射检测报告信息"></el-input>
                </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </el-tab-pane>

            <!-- 维修单 -->
            <el-tab-pane label="维修单" name="repairOrder">
              <el-form ref="viewForm" :model="form" label-width="120px">
                <el-row :gutter="20">
                  <el-col :span="24">
                    <el-form-item label="维修单：">
                      <el-input v-model="form.repairOrder" type="textarea" :rows="6" :disabled="true" placeholder="暂无维修单信息"></el-input>
                </el-form-item>
              </el-col>
                </el-row>
              </el-form>
            </el-tab-pane>

            <!-- 合同附件 -->
            <el-tab-pane label="合同附件" name="contractAttachment">
              <el-form ref="viewForm" :model="form" label-width="120px">
                <el-row :gutter="20">
                  <el-col :span="24">
                    <el-form-item label="合同附件：">
                      <el-input v-model="form.contractAttachment" type="textarea" :rows="6" :disabled="true" placeholder="暂无合同附件信息"></el-input>
                </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </el-tab-pane>

            <!-- 巡检图片 -->
            <el-tab-pane label="巡检图片" name="inspectionImage">
              <el-form ref="viewForm" :model="form" label-width="120px">
                <el-row :gutter="20">
                  <el-col :span="24">
                    <el-form-item label="巡检图片：">
                      <el-input v-model="form.inspectionImage" type="textarea" :rows="6" :disabled="true" placeholder="暂无巡检图片信息"></el-input>
                </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </el-tab-pane>

            <!-- 保养图片 -->
            <el-tab-pane label="保养图片" name="maintenanceImage">
              <el-form ref="viewForm" :model="form" label-width="120px">
                <el-row :gutter="20">
                  <el-col :span="24">
                    <el-form-item label="保养图片：">
                      <el-input v-model="form.maintenanceImage" type="textarea" :rows="6" :disabled="true" placeholder="暂无保养图片信息"></el-input>
                </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </el-tab-pane>

            <!-- 质控图片 -->
            <el-tab-pane label="质控图片" name="qualityControlImage">
              <el-form ref="viewForm" :model="form" label-width="120px">
                <el-row :gutter="20">
                  <el-col :span="24">
                    <el-form-item label="质控图片：">
                      <el-input v-model="form.qualityControlImage" type="textarea" :rows="6" :disabled="true" placeholder="暂无质控图片信息"></el-input>
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </el-tab-pane>

            <!-- 报关文件 -->
            <el-tab-pane label="报关文件" name="customsDocument">
              <el-form ref="viewForm" :model="form" label-width="120px">
                <el-row :gutter="20">
                  <el-col :span="24">
                    <el-form-item label="报关文件：">
                      <el-input v-model="form.customsDocument" type="textarea" :rows="6" :disabled="true" placeholder="暂无报关文件信息"></el-input>
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </el-tab-pane>

            <!-- 商检资质 -->
            <el-tab-pane label="商检资质" name="inspectionQualification">
              <el-form ref="viewForm" :model="form" label-width="120px">
                <el-row :gutter="20">
                  <el-col :span="24">
                    <el-form-item label="商检资质：">
                      <el-input v-model="form.inspectionQualification" type="textarea" :rows="6" :disabled="true" placeholder="暂无商检资质信息"></el-input>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>
      </el-tabs>
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
        <div class="dialog-footer">
          <el-button @click="viewOpen = false">关 闭</el-button>
        </div>
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
import { connection,connectprinter,printstart,printlabel,previewlabel } from "@/api/rfidPrinter/ZMPrintService";
import { getSbinfo,getSbLabelInfo } from "@/api/sb/sbinfo";
import { treeselect, listCategory68All } from "@/api/foundation/category68";
import { listdepartAll } from "@/api/foundation/depart";
import { listWarehouseAll } from "@/api/foundation/warehouse";
import { listUnitAll } from "@/api/foundation/unit";
import { listUserAll } from "@/api/system/user";
import { getToken } from "@/utils/auth";

export default {
  name: "EquipmentInfo",
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
      // 遮罩层
      loading: false,
      // 选中数组
      ids: [],
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
        category68Id: undefined
      },
      // 当前激活的标签页
      activeTab: 'basic',
      documentActiveTab: 'purchaseApproval',
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
          id: item.id,
          name: item.name
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
            id: item.id,
            name: item.name
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
      listEquipment(this.queryParams).then(response => {
        console.log('获取到的列表数据:', response.rows);
        this.equipmentList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
      this.documentActiveTab = 'purchaseApproval';
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
      // 可以在这里添加具体的切换逻辑，例如根据选择过滤数据
      // 如果选择"科室"，可以显示科室相关的筛选
      // 如果选择"仓库"，可以显示仓库相关的筛选
      // 如果选择"全部"，显示所有数据
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
      const id = row.id;
      getEquipment(id).then(response => {
        this.form = { ...this.form, ...response.data };
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
        this.viewOpen = true;
      }).catch(error => {
        console.error('获取设备数据失败:', error);
        this.$modal.msgError("获取设备数据失败");
      });
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      console.log('点击修改的行数据:', row);
      const id = row.id || this.ids[0];
      console.log('要查询的ID:', id);
      getEquipment(id).then(response => {
        console.log('获取到的设备数据:', response.data);
        this.form = { ...this.form, ...response.data };
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
        console.log('设置到表单的数据:', this.form);
        this.open = true;
        this.title = "修改设备信息";
      }).catch(error => {
        console.error('获取设备数据失败:', error);
        this.$modal.msgError("获取设备数据失败");
      });
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
      const isLt2M = file.size / 1024 / 1024 < 2;

      if (!isImage) {
        this.$modal.msgError('上传文件只能是图片格式!');
        return false;
      }
      if (!isLt2M) {
        this.$modal.msgError('上传图片大小不能超过 2MB!');
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
          
          if (this.form.id != null) {
            updateEquipment(submitData).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.getList();
            });
          } else {
            addEquipment(submitData).then(response => {
              this.$modal.msgSuccess("新增成功");
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
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

.search-form .el-form-item {
  margin-bottom: 15px;
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
</style>
