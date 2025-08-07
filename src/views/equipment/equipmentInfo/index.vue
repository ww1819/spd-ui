<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
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
            <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
            <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
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
          size="mini"
          @click="handleAdd"
          v-hasPermi="['equipment:info:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-edit"
          size="mini"
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
          size="mini"
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
          size="mini"
          @click="handleExport"
          v-hasPermi="['equipment:info:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="equipmentList" @selection-change="handleSelectionChange" height="calc(100vh - 330px)">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="编号" align="center" prop="equipmentId" width="60"/>
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
            size="mini"
            type="text"
            icon="el-icon-print"
            @click="handlePrint(scope.row,true)"
            v-hasPermi="['equipment:info:print']"
          >打印</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['equipment:info:edit']"
          >修改</el-button>
          <el-button
            size="mini"
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

    <!-- 添加或修改设备信息对话框 -->
    <el-dialog
      :visible.sync="open"
      :title="title"
      width="80%"
      append-to-body>
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
                <el-form-item label="附属资料：" prop="attachedMaterials">
                  <el-checkbox-group v-model="form.attachedMaterials">
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
      <div slot="footer" class="dialog-footer">
        <el-button @click="open = false">取消</el-button>
        <el-button type="primary" @click="submitForm">保存</el-button>
      </div>
    </el-dialog>

    <el-dialog :visible.sync=" modalObj.show " :title=" modalObj.title " :width=" modalObj.width ">
      <template v-if=" modalObj.component === 'print-type' ">
        <el-radio-group v-model=" modalObj.form.value ">
          <el-radio :label=" 2 ">浏览器打印</el-radio>
        </el-radio-group>
      </template>
      <template v-if=" modalObj.form.value === 2 || modalObj.component === 'window-print-preview' ">
        <gz-shipment-print :row=" modalObj.form.row " ref="receiptOrderPrintRef"></gz-shipment-print>
      </template>
      <template slot="footer" class="dialog-footer">
        <el-button @click=" modalObj.cancel ">取消</el-button>
        <el-button @click=" modalObj.ok " type="primary">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { listEquipment, getEquipment, delEquipment, addEquipment, updateEquipment } from "@/api/equipment/equipmentInfo";
import { connection,connectprinter,printstart,printlabel,previewlabel } from "@/api/rfidPrinter/ZMPrintService";
import { getSbinfo,getSbLabelInfo } from "@/api/sb/sbinfo";
import gzShipmentPrint from "@/views/gzShipment/audit/gzShipmentPrint.vue";
import {STOCK_OUT_TEMPLATE} from '@/utils/printData';
import equipmentBarcodePrint from "@/views/equipment/equipmentInfo/equipmentBarcodePrint.vue";

export default {
  name: "EquipmentInfo",
  components: {gzShipmentPrint,equipmentBarcodePrint},
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

      // 打印方式选择弹出层对象
      modalObj: {
        title: '选择打印方式',
        width: '520px',
        component: null,
        form: {
          value: null,
          row: null
        },
        ok: () => {
        },
        cancel: () => {
        }
      },
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
        attachedMaterials: [],
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
      // 模拟数据，实际项目中应该调用后端接口
      setTimeout(() => {
        this.equipmentList = [
          {
            equipmentId: 1,
            assetCode: 'ZC001',
            assetName: '数控车床',
            specification: 'CK6136×1000',
            model: 'CK6136',
            brand: '大连机床',
            supplier: '大连机床集团',
            useDepartment: '生产部',
            storageLocation: '车间A-01',
            assetStatus: '1',
            createTime: '2023-01-15 10:00:00',
            assetManager: '张三',
            maintenanceManager: '李四',
            manageDepartment: '设备部',
            assetType: '机床设备',
            factoryNumber: 'DN2023001',
            productionDate: '2022-12-01',
            registrationNumber: 'REG2023001',
            expectedOperationDate: '2023-02-01',
            fundSource: '设备采购资金',
            invoiceNumber: 'INV2023001',
            invoiceAmount: 85000,
            attachedAssetFlag: '0',
            emergencyAsset: '0',
            specialAsset: '0',
            measurementAsset: '0',
            attachedMaterials: ['说明书', '保修卡', '合格证'],
            benefitAnalysis: '1',
            remark: '高精度数控车床，用于精密零件加工',
            power: '15KW',
            theoryOperationTime: 8,
            publicEquipment: '0',
            creator: '系统管理员',
            modifier: '系统管理员',
            modifyTime: '2023-01-15 10:00:00',
            archiveUsage: '1',
            contractConsistent: '1',
            specialNetworkAsset: '0',
            building: '主厂房',
            floor: '1层',
            quantity: 1,
            contractName: '数控车床采购合同',
            contractPrice: 85000,
            signDate: '2022-12-15',
            purchaseDate: '2023-01-15',
            acceptanceDate: '2023-01-20',
            reviewTime: '2023-01-10 09:00:00',
            warrantyExpireDate: '2025-01-15',
            bidDate: '2022-11-20',
            supplyNoticeDate: '2022-12-20',
            firstAcceptanceDate: '2023-01-18',
            deliveryDeadline: '2023-01-10',
            secondAcceptanceDate: '2023-01-25',
            warrantyOutDate: '2025-01-15',
            supplierContact: '王经理',
            supplierPhone: '0411-12345678',
            maintenanceCompany: '大连机床维修中心',
            maintenanceContact: '赵工程师',
            maintenancePhone: '0411-87654321',
            manufacturer: '大连机床集团',
            purchaseMethod: '1',
            biddingForm: '1',
            singleBudget: 90000,
            projectBasis: '生产需要',
            biddingNumber: 'BD2022001',
            biddingDate: '2022-11-15',
            biddingAmount: 85000
          },
          {
            equipmentId: 2,
            assetCode: 'ZC002',
            assetName: '立式加工中心',
            specification: 'VMC850',
            model: 'VMC850',
            brand: '沈阳机床',
            supplier: '沈阳机床集团',
            useDepartment: '技术部',
            storageLocation: '车间B-02',
            assetStatus: '1',
            createTime: '2023-03-20 14:00:00',
            assetManager: '李四',
            maintenanceManager: '王五',
            manageDepartment: '设备部',
            assetType: '机床设备',
            factoryNumber: 'SY2023002',
            productionDate: '2023-02-01',
            registrationNumber: 'REG2023002',
            expectedOperationDate: '2023-04-01',
            fundSource: '技术研发资金',
            invoiceNumber: 'INV2023002',
            invoiceAmount: 180000,
            attachedAssetFlag: '0',
            emergencyAsset: '0',
            specialAsset: '0',
            measurementAsset: '0',
            attachedMaterials: ['说明书', '保修卡', '合格证', '检验报告书'],
            benefitAnalysis: '1',
            remark: '五轴联动加工中心，适用于复杂零件加工',
            power: '25KW',
            theoryOperationTime: 10,
            publicEquipment: '0',
            creator: '系统管理员',
            modifier: '系统管理员',
            modifyTime: '2023-03-20 14:00:00',
            archiveUsage: '1',
            contractConsistent: '1',
            specialNetworkAsset: '0',
            building: '主厂房',
            floor: '1层',
            quantity: 1,
            contractName: '立式加工中心采购合同',
            contractPrice: 180000,
            signDate: '2023-02-15',
            purchaseDate: '2023-03-20',
            acceptanceDate: '2023-03-25',
            reviewTime: '2023-03-15 10:00:00',
            warrantyExpireDate: '2025-03-20',
            bidDate: '2023-01-20',
            supplyNoticeDate: '2023-02-20',
            firstAcceptanceDate: '2023-03-22',
            deliveryDeadline: '2023-03-15',
            secondAcceptanceDate: '2023-03-28',
            warrantyOutDate: '2025-03-20',
            supplierContact: '刘经理',
            supplierPhone: '024-12345678',
            maintenanceCompany: '沈阳机床维修中心',
            maintenanceContact: '孙工程师',
            maintenancePhone: '024-87654321',
            manufacturer: '沈阳机床集团',
            purchaseMethod: '1',
            biddingForm: '1',
            singleBudget: 200000,
            projectBasis: '技术研发需要',
            biddingNumber: 'BD2023002',
            biddingDate: '2023-01-15',
            biddingAmount: 180000
          },
          {
            equipmentId: 3,
            assetCode: 'ZC003',
            assetName: '激光切割机',
            specification: 'LC3015',
            model: 'LC3015',
            brand: '大族激光',
            supplier: '大族激光',
            useDepartment: '制造部',
            storageLocation: '车间C-03',
            assetStatus: '0',
            createTime: '2023-06-10 16:00:00',
            assetManager: '王五',
            maintenanceManager: '赵六',
            manageDepartment: '设备部',
            assetType: '激光设备',
            factoryNumber: 'DZ2023003',
            productionDate: '2023-05-01',
            registrationNumber: 'REG2023003',
            expectedOperationDate: '2023-07-01',
            fundSource: '制造设备资金',
            invoiceNumber: 'INV2023003',
            invoiceAmount: 120000,
            attachedAssetFlag: '0',
            emergencyAsset: '0',
            specialAsset: '0',
            measurementAsset: '0',
            attachedMaterials: ['说明书', '保修卡', '合格证'],
            benefitAnalysis: '1',
            remark: '光纤激光切割机，切割精度高，速度快',
            power: '3KW',
            theoryOperationTime: 12,
            publicEquipment: '0',
            creator: '系统管理员',
            modifier: '系统管理员',
            modifyTime: '2023-06-10 16:00:00',
            archiveUsage: '1',
            contractConsistent: '1',
            specialNetworkAsset: '0',
            building: '主厂房',
            floor: '1层',
            quantity: 1,
            contractName: '激光切割机采购合同',
            contractPrice: 120000,
            signDate: '2023-05-15',
            purchaseDate: '2023-06-10',
            acceptanceDate: '2023-06-15',
            reviewTime: '2023-06-05 14:00:00',
            warrantyExpireDate: '2025-06-10',
            bidDate: '2023-04-20',
            supplyNoticeDate: '2023-05-20',
            firstAcceptanceDate: '2023-06-12',
            deliveryDeadline: '2023-06-05',
            secondAcceptanceDate: '2023-06-18',
            warrantyOutDate: '2025-06-10',
            supplierContact: '陈经理',
            supplierPhone: '0755-12345678',
            maintenanceCompany: '大族激光维修中心',
            maintenanceContact: '钱工程师',
            maintenancePhone: '0755-87654321',
            manufacturer: '大族激光',
            purchaseMethod: '1',
            biddingForm: '1',
            singleBudget: 130000,
            projectBasis: '制造需要',
            biddingNumber: 'BD2023003',
            biddingDate: '2023-04-15',
            biddingAmount: 120000
          },
          {
            equipmentId: 4,
            assetCode: 'ZC004',
            assetName: '折弯机',
            specification: 'WC67K-100/3200',
            model: 'WC67K-100/3200',
            brand: '亚威机床',
            supplier: '亚威机床',
            useDepartment: '钣金部',
            storageLocation: '车间D-04',
            assetStatus: '1',
            createTime: '2023-08-15 11:00:00',
            assetManager: '赵六',
            maintenanceManager: '钱七',
            manageDepartment: '设备部',
            assetType: '钣金设备',
            factoryNumber: 'YW2023004',
            productionDate: '2023-07-01',
            registrationNumber: 'REG2023004',
            expectedOperationDate: '2023-09-01',
            fundSource: '钣金设备资金',
            invoiceNumber: 'INV2023004',
            invoiceAmount: 65000,
            attachedAssetFlag: '0',
            emergencyAsset: '0',
            specialAsset: '0',
            measurementAsset: '0',
            attachedMaterials: ['说明书', '保修卡', '合格证'],
            benefitAnalysis: '1',
            remark: '数控折弯机，适用于各种金属板材折弯',
            power: '8KW',
            theoryOperationTime: 8,
            publicEquipment: '0',
            creator: '系统管理员',
            modifier: '系统管理员',
            modifyTime: '2023-08-15 11:00:00',
            archiveUsage: '1',
            contractConsistent: '1',
            specialNetworkAsset: '0',
            building: '主厂房',
            floor: '1层',
            quantity: 1,
            contractName: '折弯机采购合同',
            contractPrice: 65000,
            signDate: '2023-07-15',
            purchaseDate: '2023-08-15',
            acceptanceDate: '2023-08-20',
            reviewTime: '2023-08-10 09:00:00',
            warrantyExpireDate: '2025-08-15',
            bidDate: '2023-06-20',
            supplyNoticeDate: '2023-07-20',
            firstAcceptanceDate: '2023-08-17',
            deliveryDeadline: '2023-08-10',
            secondAcceptanceDate: '2023-08-22',
            warrantyOutDate: '2025-08-15',
            supplierContact: '周经理',
            supplierPhone: '0514-12345678',
            maintenanceCompany: '亚威机床维修中心',
            maintenanceContact: '吴工程师',
            maintenancePhone: '0514-87654321',
            manufacturer: '亚威机床',
            purchaseMethod: '1',
            biddingForm: '1',
            singleBudget: 70000,
            projectBasis: '钣金加工需要',
            biddingNumber: 'BD2023004',
            biddingDate: '2023-06-15',
            biddingAmount: 65000
          },
          {
            equipmentId: 5,
            assetCode: 'ZC005',
            assetName: '冲床',
            specification: 'J23-25',
            model: 'J23-25',
            brand: '扬力集团',
            supplier: '扬力集团',
            useDepartment: '冲压部',
            storageLocation: '车间E-05',
            assetStatus: '1',
            createTime: '2023-10-20 15:00:00',
            assetManager: '钱七',
            maintenanceManager: '孙八',
            manageDepartment: '设备部',
            assetType: '冲压设备',
            factoryNumber: 'YL2023005',
            productionDate: '2023-09-01',
            registrationNumber: 'REG2023005',
            expectedOperationDate: '2023-11-01',
            fundSource: '冲压设备资金',
            invoiceNumber: 'INV2023005',
            invoiceAmount: 45000,
            attachedAssetFlag: '0',
            emergencyAsset: '0',
            specialAsset: '0',
            measurementAsset: '0',
            attachedMaterials: ['说明书', '保修卡', '合格证'],
            benefitAnalysis: '1',
            remark: '开式可倾压力机，适用于冲孔、落料等工序',
            power: '5KW',
            theoryOperationTime: 8,
            publicEquipment: '0',
            creator: '系统管理员',
            modifier: '系统管理员',
            modifyTime: '2023-10-20 15:00:00',
            archiveUsage: '1',
            contractConsistent: '1',
            specialNetworkAsset: '0',
            building: '主厂房',
            floor: '1层',
            quantity: 1,
            contractName: '冲床采购合同',
            contractPrice: 45000,
            signDate: '2023-09-15',
            purchaseDate: '2023-10-20',
            acceptanceDate: '2023-10-25',
            reviewTime: '2023-10-15 11:00:00',
            warrantyExpireDate: '2025-10-20',
            bidDate: '2023-08-20',
            supplyNoticeDate: '2023-09-20',
            firstAcceptanceDate: '2023-10-22',
            deliveryDeadline: '2023-10-15',
            secondAcceptanceDate: '2023-10-28',
            warrantyOutDate: '2025-10-20',
            supplierContact: '郑经理',
            supplierPhone: '0514-12345679',
            maintenanceCompany: '扬力集团维修中心',
            maintenanceContact: '冯工程师',
            maintenancePhone: '0514-87654322',
            manufacturer: '扬力集团',
            purchaseMethod: '1',
            biddingForm: '1',
            singleBudget: 50000,
            projectBasis: '冲压加工需要',
            biddingNumber: 'BD2023005',
            biddingDate: '2023-08-15',
            biddingAmount: 45000
          }
        ];
        this.total = 5;
        this.loading = false;
      }, 500);
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
        attachedMaterials: [],
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
      this.ids = selection.map(item => item.equipmentId)
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
      this.reset();
      const equipmentId = row.equipmentId || this.ids
      // 模拟获取数据，实际项目中应该调用后端接口
      setTimeout(() => {
        this.form = {
          ...this.form,
          equipmentId: equipmentId,
          assetName: '测试设备' + equipmentId,
          assetStatus: '1',
          financialCategory: '1',
          useDepartment: '1'
        };
        this.open = true;
        this.title = "修改设备信息";
      }, 500);
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          // 模拟提交，实际项目中应该调用后端接口
          setTimeout(() => {
            this.$modal.msgSuccess(this.form.equipmentId ? "修改成功" : "新增成功");
            this.open = false;
            this.getList();
          }, 500);
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const equipmentIds = row.equipmentId || this.ids;
      this.$modal.confirm('是否确认删除设备信息编号为"' + equipmentIds + '"的数据项？').then(() => {
        // 模拟删除，实际项目中应该调用后端接口
        setTimeout(() => {
          this.getList();
          this.$modal.msgSuccess("删除成功");
        }, 500);
      }).catch(() => {});
    },
    /** 导出按钮操作 */
    handleExport() {
      this.$modal.msgSuccess("导出成功");
    },
    /** 打印按钮操作 */
    handlePrint(row, print){
      this.modalObj = {
        show: true,
        title: '选择打印方式',
        width: '520px',
        component: 'print-type',
        form: {
          value: 1,
          row
        },
        ok: () => {
          this.modalObj.show = false
          if (this.modalObj.form.value === 1) {
            this.doPrintOut(row, false)
          } else {
            this.windowPrintOut(row, print)
          }
        },
        cancel: () => {
          this.modalObj.show = false
        }
      }
    },
    windowPrintOut(row, print) {
      this.row.then(res => {
        if (print) {
          this.modalObj.form.row = res
          this.$nextTick(() => {
            this.$refs['receiptOrderPrintRef'].start()
          })
          return
        }
        this.$nextTick(() => {
          this.modalObj = {
            show: true,
            title: '浏览器打印预览',
            width: '800px',
            component: 'window-print-preview',
            form: {
              value: 1,
              row,
              print
            },
            ok: () => {
              this.modalObj.show = false
            },
            cancel: () => {
              this.modalObj.show = false
            }
          }
        })
      })
    },
    doPrintOut(row, print) {
      this.row.then(result => {
        if (print) {
          this.$lodop.print(STOCK_OUT_TEMPLATE, [result])
        } else {
          this.$lodop.preview(STOCK_OUT_TEMPLATE, [result])
        }
      })
    }

    /** 打印按钮操作 */
    // handlePrint(row) {
    //   var equipmentId = row.equipmentId || this.ids;
    //   this.queryParams.code = equipmentId;
    //   var sbLabelInfo = getSbLabelInfo(this.queryParams);
    //   if (!sbLabelInfo) {
    //     this.$modal.msgError("设备标签信息不存在或未找到");
    //     return;
    //   }
    //   this.$modal.msgSuccess("设备标签信息:"+sbLabelInfo);
    //   // this.$modal.loading("正在连接打印机，请稍候...");
    //   connectprinter();
    //   printlabel(sbLabelInfo);
    //   this.$modal.msgSuccess("打印成功");
    // }
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
</style>
