<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px" class="search-form">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="资产名称" prop="assetName">
            <el-input
              v-model="queryParams.assetName"
              placeholder="请输入资产名称"
              clearable
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="资产编号" prop="assetCode">
            <el-input
              v-model="queryParams.assetCode"
              placeholder="请输入资产编号"
              clearable
              @keyup.enter.native="handleQuery"
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
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="资产状态" prop="assetStatus">
            <el-select v-model="queryParams.assetStatus" placeholder="请选择状态" clearable>
              <el-option label="启用" value="1"></el-option>
              <el-option label="停用" value="0"></el-option>
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
                            style="width: 140px"
            >
            </el-date-picker>
            <span>止</span>
            <el-date-picker clearable
                            v-model="queryParams.endDate"
                            type="date"
                            value-format="yyyy-MM-dd"
                            placeholder="请选择截止日期"
                            style="width: 140px"
            >
            </el-date-picker>
          </div>
        </el-col>
        <el-col :span="6">
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery">搜索</el-button>
            <el-button icon="el-icon-refresh" size="small" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <el-row :gutter="10" class="mb8">
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
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="equipmentList" @selection-change="handleSelectionChange" height="calc(100vh - 40vh)">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="编号" align="center" prop="id" width="60"/>
      <el-table-column label="资产编号" align="center" prop="assetCode" width="120"/>
      <el-table-column label="资产名称" align="center" prop="assetName" width="180"/>
      <el-table-column label="规格" align="center" prop="specification" width="120"/>
      <el-table-column label="型号" align="center" prop="model" width="120"/>
      <el-table-column label="品牌" align="center" prop="brand" width="100"/>
      <el-table-column label="供应商" align="center" prop="supplier" width="150"/>
      <el-table-column label="使用科室" align="center" prop="useDepartment" width="120"/>
      <el-table-column label="存放地点" align="center" prop="storageLocation" width="120"/>
      <el-table-column label="资产状态" align="center" prop="assetStatus" width="100">
        <template slot-scope="scope">
          <el-tag :type="scope.row.assetStatus === '1' ? 'success' : 'danger'">
            {{ scope.row.assetStatus === '1' ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建日期" align="center" prop="createTime" width="120">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="120">
        <template slot-scope="scope">
          <el-button
            size="small"
            type="text"
            icon="el-icon-print"
            @click="handlePrint(scope.row)"
            v-hasPermi="['equipment:info:print']"
          >打印</el-button>
          <el-button
            size="small"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['equipment:info:edit']"
          >修改</el-button>
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

    <!-- 添加或修改设备信息局部弹窗 -->
    <div v-if="open" class="local-modal-mask">
      <div class="local-modal-content">
        <div style="font-size:18px;font-weight:bold;margin-bottom:16px;">{{ title }}</div>
      <el-tabs v-model="activeTab">
        <!-- 基本信息 -->
        <el-tab-pane label="基本信息" name="basic">
          <el-form ref="form" :model="form" :rules="rules" label-width="120px">
            <el-row :gutter="20">
              <!-- 第一列 -->
              <el-col :span="8">
                <el-form-item label="资产编号：" prop="assetCode">
                  <el-input v-model="form.assetCode"></el-input>
                </el-form-item>
                <el-form-item label="院内编码：" prop="hospitalCode">
                  <el-input v-model="form.hospitalCode"></el-input>
                </el-form-item>
                <el-form-item label="条码号：" prop="barcode">
                  <el-input v-model="form.barcode"></el-input>
                </el-form-item>
                <el-form-item label="资产名称：" prop="assetName" required>
                  <el-input v-model="form.assetName"></el-input>
                </el-form-item>
                <el-form-item label="资产别名：" prop="assetAlias">
                  <el-input v-model="form.assetAlias"></el-input>
                </el-form-item>
                <el-form-item label="辅助分类：" prop="auxiliaryCategory">
                  <el-select v-model="form.auxiliaryCategory" style="width:100%">
                    <el-option label="分类1" value="1"></el-option>
                    <el-option label="分类2" value="2"></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item label="资产状态：" prop="assetStatus" required>
                  <el-select v-model="form.assetStatus" style="width:100%">
                    <el-option label="启用" value="1"></el-option>
                    <el-option label="停用" value="0"></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item label="财务分类：" prop="financialCategory" required>
                  <el-select v-model="form.financialCategory" style="width:100%">
                    <el-option label="分类1" value="1"></el-option>
                    <el-option label="分类2" value="2"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>

              <!-- 第二列 -->
              <el-col :span="8">
                <el-form-item label="财务编号：" prop="financialCode">
                  <el-input v-model="form.financialCode"></el-input>
                </el-form-item>
                <el-form-item label="品牌：" prop="brand">
                  <el-input v-model="form.brand"></el-input>
                </el-form-item>
                <el-form-item label="产地：" prop="origin">
                  <el-input v-model="form.origin"></el-input>
                </el-form-item>
                <el-form-item label="国别：" prop="country">
                  <el-input v-model="form.country"></el-input>
                </el-form-item>
                <el-form-item label="规格：" prop="specification">
                  <el-input v-model="form.specification"></el-input>
                </el-form-item>
                <el-form-item label="型号：" prop="model">
                  <el-input v-model="form.model"></el-input>
                </el-form-item>
                <el-form-item label="单位：" prop="unit">
                  <el-input v-model="form.unit"></el-input>
                </el-form-item>
                <el-form-item label="档案编号：" prop="archiveCode">
                  <el-input v-model="form.archiveCode"></el-input>
                </el-form-item>
                <el-form-item label="资产序列号：" prop="serialNumber">
                  <el-input v-model="form.serialNumber"></el-input>
                </el-form-item>
              </el-col>

              <!-- 第三列 -->
              <el-col :span="8">
                <el-form-item label="资产负责人：" prop="assetManager">
                  <el-select v-model="form.assetManager" style="width:100%">
                    <el-option label="负责人1" value="1"></el-option>
                    <el-option label="负责人2" value="2"></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item label="维修负责人：" prop="maintenanceManager">
                  <el-select v-model="form.maintenanceManager" style="width:100%">
                    <el-option label="负责人1" value="1"></el-option>
                    <el-option label="负责人2" value="2"></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item label="使用科室：" prop="useDepartment" required>
                  <el-select v-model="form.useDepartment" style="width:100%">
                    <el-option label="科室1" value="1"></el-option>
                    <el-option label="科室2" value="2"></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item label="管理科室：" prop="manageDepartment">
                  <el-select v-model="form.manageDepartment" style="width:100%">
                    <el-option label="科室1" value="1"></el-option>
                    <el-option label="科室2" value="2"></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item label="存放地点：" prop="storageLocation">
                  <el-input v-model="form.storageLocation"></el-input>
                </el-form-item>
                <el-form-item label="资产类型：" prop="assetType">
                  <el-select v-model="form.assetType" style="width:100%">
                    <el-option label="类型1" value="1"></el-option>
                    <el-option label="类型2" value="2"></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item label="出厂编号：" prop="factoryNumber">
                  <el-input v-model="form.factoryNumber"></el-input>
                </el-form-item>
                <el-form-item label="出厂日期：" prop="productionDate">
                  <el-date-picker v-model="form.productionDate" type="date" style="width:100%"></el-date-picker>
                </el-form-item>
              </el-col>
            </el-row>

            <!-- 第二行 -->
            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="注册证件号：" prop="registrationNumber">
                  <el-input v-model="form.registrationNumber"></el-input>
                </el-form-item>
                <el-form-item label="预计开机工作日：" prop="expectedOperationDate">
                  <el-date-picker v-model="form.expectedOperationDate" type="date" style="width:100%"></el-date-picker>
                </el-form-item>
                <el-form-item label="资金来源：" prop="fundSource">
                  <el-select v-model="form.fundSource" style="width:100%">
                    <el-option label="来源1" value="1"></el-option>
                    <el-option label="来源2" value="2"></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item label="发票编号：" prop="invoiceNumber">
                  <el-input v-model="form.invoiceNumber"></el-input>
                </el-form-item>
                <el-form-item label="发票金额：" prop="invoiceAmount">
                  <el-input-number v-model="form.invoiceAmount" style="width:100%"></el-input-number>
                </el-form-item>
              </el-col>

              <el-col :span="8">
                <el-form-item label="附资产标志：" prop="attachedAssetFlag">
                  <el-select v-model="form.attachedAssetFlag" style="width:100%">
                    <el-option label="是" value="1"></el-option>
                    <el-option label="否" value="0"></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item label="急救资产：" prop="emergencyAsset">
                  <el-select v-model="form.emergencyAsset" style="width:100%">
                    <el-option label="是" value="1"></el-option>
                    <el-option label="否" value="0"></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item label="特种资产：" prop="specialAsset">
                  <el-select v-model="form.specialAsset" style="width:100%">
                    <el-option label="是" value="1"></el-option>
                    <el-option label="否" value="0"></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item label="计量资产：" prop="measurementAsset">
                  <el-select v-model="form.measurementAsset" style="width:100%">
                    <el-option label="是" value="1"></el-option>
                    <el-option label="否" value="0"></el-option>
                  </el-select>
                </el-form-item>
                                    <el-form-item label="附属资料：" prop="attachedMaterialsList">
                    <el-checkbox-group v-model="form.attachedMaterialsList">
                    <el-checkbox label="说明书"></el-checkbox>
                    <el-checkbox label="保修卡"></el-checkbox>
                    <el-checkbox label="合格证"></el-checkbox>
                    <el-checkbox label="检验报告书"></el-checkbox>
                    <el-checkbox label="报关单"></el-checkbox>
                  </el-checkbox-group>
                </el-form-item>
              </el-col>

              <el-col :span="8">
                <el-form-item label="效益分析：" prop="benefitAnalysis">
                  <el-select v-model="form.benefitAnalysis" style="width:100%">
                    <el-option label="是" value="1"></el-option>
                    <el-option label="否" value="0"></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item label="备注：" prop="remark">
                  <el-input v-model="form.remark" type="textarea"></el-input>
                </el-form-item>
                <el-form-item label="设备功率：" prop="power">
                  <el-input v-model="form.power"></el-input>
                </el-form-item>
                <el-form-item label="理论开机时间：" prop="theoryOperationTime">
                  <el-input-number v-model="form.theoryOperationTime" style="width:100%"></el-input-number>
                  <span style="margin-left:10px">h/天</span>
                </el-form-item>
                <el-form-item label="公用设备：" prop="publicEquipment">
                  <el-select v-model="form.publicEquipment" style="width:100%">
                    <el-option label="是" value="1"></el-option>
                    <el-option label="否" value="0"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <!-- 第三行 -->
            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="录入人：" prop="creator">
                  <el-input v-model="form.creator"></el-input>
                </el-form-item>
                <el-form-item label="录入日期：" prop="createTime">
                  <el-date-picker v-model="form.createTime" type="datetime" style="width:100%"></el-date-picker>
                </el-form-item>
              </el-col>

              <el-col :span="8">
                <el-form-item label="最后修改人：" prop="modifier">
                  <el-input v-model="form.modifier"></el-input>
                </el-form-item>
                <el-form-item label="最后修改时间：" prop="modifyTime">
                  <el-date-picker v-model="form.modifyTime" type="datetime" style="width:100%"></el-date-picker>
                </el-form-item>
              </el-col>

              <el-col :span="8">
                <el-form-item label="档案使用情况：" prop="archiveUsage">
                  <el-select v-model="form.archiveUsage" style="width:100%">
                    <el-option label="是" value="1"></el-option>
                    <el-option label="否" value="0"></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item label="合同与清单是否一致：" prop="contractConsistent">
                  <el-select v-model="form.contractConsistent" style="width:100%">
                    <el-option label="是" value="1"></el-option>
                    <el-option label="否" value="0"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <!-- 第四行 -->
            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="是否专网资产：" prop="specialNetworkAsset">
                  <el-select v-model="form.specialNetworkAsset" style="width:100%">
                    <el-option label="是" value="1"></el-option>
                    <el-option label="否" value="0"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>

              <el-col :span="8">
                <el-form-item label="楼宇：" prop="building">
                  <el-input v-model="form.building"></el-input>
                </el-form-item>
              </el-col>

              <el-col :span="8">
                <el-form-item label="楼层：" prop="floor">
                  <el-input v-model="form.floor"></el-input>
                </el-form-item>
              </el-col>
            </el-row>

            <!-- 第五行 -->
            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="数量：" prop="quantity">
                  <el-input-number v-model="form.quantity" style="width:100%"></el-input-number>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <!-- 合同信息 -->
        <el-tab-pane label="合同信息" name="contract">
          <el-form ref="form" :model="form" label-width="120px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="合同名称：" prop="contractName">
                  <el-input v-model="form.contractName"></el-input>
                </el-form-item>
                <el-form-item label="合同价格：" prop="contractPrice">
                  <el-input-number v-model="form.contractPrice" style="width:100%"></el-input-number>
                </el-form-item>
                <el-form-item label="签订日期：" prop="signDate">
                  <el-date-picker v-model="form.signDate" type="date" style="width:100%"></el-date-picker>
                </el-form-item>
                <el-form-item label="购入日期：" prop="purchaseDate">
                  <el-date-picker v-model="form.purchaseDate" type="date" style="width:100%"></el-date-picker>
                </el-form-item>
                <el-form-item label="验收合格日期：" prop="acceptanceDate">
                  <el-date-picker v-model="form.acceptanceDate" type="date" style="width:100%"></el-date-picker>
                </el-form-item>
                <el-form-item label="送审时间：" prop="reviewTime">
                  <el-date-picker v-model="form.reviewTime" type="datetime" style="width:100%"></el-date-picker>
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item label="保修到期：" prop="warrantyExpireDate">
                  <el-date-picker v-model="form.warrantyExpireDate" type="date" style="width:100%"></el-date-picker>
                </el-form-item>
                <el-form-item label="中标日期：" prop="bidDate">
                  <el-date-picker v-model="form.bidDate" type="date" style="width:100%"></el-date-picker>
                </el-form-item>
                <el-form-item label="通知供货时间：" prop="supplyNoticeDate">
                  <el-date-picker v-model="form.supplyNoticeDate" type="date" style="width:100%"></el-date-picker>
                </el-form-item>
                <el-form-item label="首次验收日期：" prop="firstAcceptanceDate">
                  <el-date-picker v-model="form.firstAcceptanceDate" type="date" style="width:100%"></el-date-picker>
                </el-form-item>
                <el-form-item label="交货截止日期：" prop="deliveryDeadline">
                  <el-date-picker v-model="form.deliveryDeadline" type="date" style="width:100%"></el-date-picker>
                </el-form-item>
                <el-form-item label="二次验收日期：" prop="secondAcceptanceDate">
                  <el-date-picker v-model="form.secondAcceptanceDate" type="date" style="width:100%"></el-date-picker>
                </el-form-item>
                <el-form-item label="出保日期：" prop="warrantyOutDate">
                  <el-date-picker v-model="form.warrantyOutDate" type="date" style="width:100%"></el-date-picker>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <!-- 厂家信息 -->
        <el-tab-pane label="厂家信息" name="manufacturer">
          <el-form ref="form" :model="form" label-width="120px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="供应商：" prop="supplier">
                  <el-input v-model="form.supplier"></el-input>
                </el-form-item>
                <el-form-item label="联系人：" prop="supplierContact">
                  <el-input v-model="form.supplierContact"></el-input>
                </el-form-item>
                <el-form-item label="供应电话：" prop="supplierPhone">
                  <el-input v-model="form.supplierPhone"></el-input>
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item label="维修公司：" prop="maintenanceCompany">
                  <el-input v-model="form.maintenanceCompany"></el-input>
                </el-form-item>
                <el-form-item label="联系人：" prop="maintenanceContact">
                  <el-input v-model="form.maintenanceContact"></el-input>
                </el-form-item>
                <el-form-item label="维修电话：" prop="maintenancePhone">
                  <el-input v-model="form.maintenancePhone"></el-input>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="生产厂商：" prop="manufacturer">
                  <el-input v-model="form.manufacturer"></el-input>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <!-- 招标信息 -->
        <el-tab-pane label="招标信息" name="bidding">
          <el-form ref="form" :model="form" label-width="120px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="采购方式：" prop="purchaseMethod">
                  <el-select v-model="form.purchaseMethod" style="width:100%">
                    <el-option label="公开招标" value="1"></el-option>
                    <el-option label="邀请招标" value="2"></el-option>
                    <el-option label="竞争性谈判" value="3"></el-option>
                    <el-option label="单一来源" value="4"></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item label="招标形式：" prop="biddingForm">
                  <el-select v-model="form.biddingForm" style="width:100%">
                    <el-option label="公开招标" value="1"></el-option>
                    <el-option label="邀请招标" value="2"></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item label="单项预算：" prop="singleBudget">
                  <el-input-number v-model="form.singleBudget" style="width:100%"></el-input-number>
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item label="立项依据：" prop="projectBasis">
                  <el-input v-model="form.projectBasis" type="textarea"></el-input>
                </el-form-item>
                <el-form-item label="招标编号：" prop="biddingNumber">
                  <el-input v-model="form.biddingNumber"></el-input>
                </el-form-item>
                <el-form-item label="招标日期：" prop="biddingDate">
                  <el-date-picker v-model="form.biddingDate" type="date" style="width:100%"></el-date-picker>
                </el-form-item>
                <el-form-item label="中标金额：" prop="biddingAmount">
                  <el-input-number v-model="form.biddingAmount" style="width:100%"></el-input-number>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>
      </el-tabs>
        <div class="dialog-footer">
          <el-button @click="cancel">取 消</el-button>
          <el-button type="primary" @click="submitForm">确 定</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { listEquipment, getEquipment, delEquipment, addEquipment, updateEquipment, getEquipmentStatistics } from "@/api/equipment/equipmentInfo";
import { connection,connectprinter,printstart,printlabel,previewlabel } from "@/api/rfidPrinter/ZMPrintService";
import { getSbinfo,getSbLabelInfo } from "@/api/sb/sbinfo";

export default {
  name: "EquipmentInfo",
  dicts: ['sys_normal_disable'],
  data() {
    return {
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
      // 总条数
      total: 0,
      // 设备信息表格数据
      equipmentList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        assetName: null,
        assetCode: null,
        useDepartment: null,
        assetStatus: null,
        beginDate: null,
        endDate: null
      },
      // 当前激活的标签页
      activeTab: 'basic',
      // 表单参数
      form: {
        assetCode: '',
        hospitalCode: '',
        barcode: '',
        assetName: '',
        assetAlias: '',
        auxiliaryCategory: '',
        assetStatus: '',
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
        biddingAmount: 0
      },
      // 表单校验
      rules: {
        assetName: [
          { required: true, message: "资产名称不能为空", trigger: "blur" }
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
  created() {
    this.getList();
  },
  methods: {
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
        assetStatus: '',
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
        biddingAmount: 0
      };
      this.resetForm("form");
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
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加设备信息";
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
        console.log('设置到表单的数据:', this.form);
        this.open = true;
        this.title = "修改设备信息";
      }).catch(error => {
        console.error('获取设备数据失败:', error);
        this.$modal.msgError("获取设备数据失败");
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != null) {
            updateEquipment(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addEquipment(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
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

.dialog-footer {
  text-align: right;
  margin-top: 20px;
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
  min-width: 600px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
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
</style>
