<template>
    <div class="equipment-management">
      <!-- 左侧树形菜单 -->
      <div class="sidebar">
        <el-tree :data="treeData" :props="treeProps" default-expand-all @node-click="handleNodeClick"></el-tree>
      </div>
  
      <!-- 右侧内容区域 -->
      <div class="content">
        <!-- 操作按钮 -->
        <div class="operation-buttons">
          <el-button type="primary" icon="el-icon-plus" @click="showAddDialog">新增</el-button>
          <el-button type="primary" icon="el-icon-edit" @click="handleEdit">修改</el-button>
          <el-button type="danger" icon="el-icon-delete" @click="handleDelete">删除</el-button>
          <el-button icon="el-icon-search" @click="handleSearch">查询</el-button>
        </div>
  
        <!-- 数据表格 -->
        <div class="data-table">
          <div class="table-header">数据列表双击查看详细信息</div>
          <el-table :data="tableData" border style="width: 100%" :header-cell-style="{background:'#f5f7fa',color:'#606266'}">
            <el-table-column prop="id" label="编号" width="80"></el-table-column>
            <el-table-column prop="code" label="设备编码"></el-table-column>
            <el-table-column prop="name" label="设备名称"></el-table-column>
            <el-table-column prop="spec" label="设备规格"></el-table-column>
            <el-table-column prop="supplier" label="设备供应商"></el-table-column>
            <el-table-column prop="value" label="设备净值"></el-table-column>
            <el-table-column prop="unit" label="设备单位"></el-table-column>
          </el-table>
          <div class="pagination">
            <el-pagination
              layout="prev, pager, next"
              :total="10"
              background
            ></el-pagination>
          </div>
          <div class="total-amount">总金额: 201000</div>
        </div>
      </div>
  
      <!-- 修改后的新增对话框 -->
      <el-dialog 
        :visible.sync="addDialogVisible" 
        title="新增设备信息"
        width="70%">
        <el-tabs v-model="activeTab">
          <!-- 保持原有的tab内容不变 -->
          <el-tab-pane label="基本信息" name="basic">
            <el-form ref="form" :model="form" label-width="120px">
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
                    <el-select v-model="form.fancialCategory" style="width:100%">
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
                    <el-input v-model="form.ininvoiceNumber"></el-input>
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
        <span slot="footer" class="dialog-footer">
          <el-button @click="addDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSave">保存</el-button>
        </span>
      </el-dialog>
</div>
  </template>
  
  <script>
  export default {
    data() {
      return {
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
      contractNumber: '',
      contractDate: '',
      contractAmount: '',
      manufacturerName: '',
      manufacturerAddress: '',
      manufacturerContact: '',
      biddingNumber: '',
      biddingDate: '',
      biddingAmount: '',
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
      // 保留原有的合同信息和厂家信息字段
      contractNumber: '',
      contractDate: '',
      contractAmount: '',
      manufacturerName: '',
      manufacturerAddress: '',
      manufacturerContact: '',
      biddingNumber: '',
      biddingDate: '',
      biddingAmount: '',
      supplier: '',
      supplierContact: '',
      supplierPhone: '',
      maintenanceCompany: '',
      maintenanceContact: '',
      maintenancePhone: '',
      manufacturer: '',
      // 保留原有的其他字段
      manufacturerName: '',
      manufacturerAddress: '',
      manufacturerContact: ''
    },
        treeData: [
          {
            label: '手术室',
            children: [
              { label: '介入室' },
              { label: '急症科' },
              { label: '重症医学科' }
            ]
          }
        ],
        treeProps: {
          label: 'label',
          children: 'children'
        },
        tableData: [
          {
            id: '1',
            code: '6801021021',
            name: '玻璃老花镜A',
            spec: '1付*1',
            supplier: '测试供应商',
            value: '1000',
            unit: '付'
          },
          {
            id: '2',
            code: '6801021022',
            name: '心电图机',
            spec: '1付*1',
            supplier: '测试供应商',
            value: '20000',
            unit: '台'
          }
        ],
        addDialogVisible: false,
        activeTab: 'basic',
      };
    },
    methods: {
      handleNodeClick(data) {
        console.log('点击节点:', data);
      },
      showAddDialog() {
        this.addDialogVisible = true;
      },
      closeAddDialog() {
        this.addDialogVisible = false;
        this.resetForm();
      },
      handleEdit() {
        console.log('修改');
      },
      handleDelete() {
        console.log('删除');
      },
      handleSearch() {
        console.log('查询');
      },
      handleSave() {
        console.log('保存表单数据:', this.form);
        this.addDialogVisible = false;
      },
      handleClear() {
        this.resetForm();
      },
      resetForm() {
        this.form = {
          name: '',
          code: '',
          spec: '',
          supplier: '',
          value: '',
          unit: '',
          contractNumber: '',
          contractDate: '',
          contractAmount: '',
          manufacturerName: '',
          manufacturerAddress: '',
          manufacturerContact: '',
          biddingNumber: '',
          biddingDate: '',
          biddingAmount: ''
        };
      }
    }
  };
  </script>
  
  <style scoped>
  .equipment-management {
    display: flex;
    height: 91vh;
  }
  
  .sidebar {
    width: 250px;
    background-color: #f5f7fa;
    border-right: 1px solid #e4e7ed;
  }
  
  .content {
    flex: 1;
    padding: 20px;
  }
  
  .operation-buttons {
    margin-bottom: 15px;
  }
  
  .data-table {
    background-color: #fff;
    border-radius: 5px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    padding: 15px;
  }
  
  .table-header {
    font-weight: bold;
    margin-bottom: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid #e4e7ed;
  }
  
  .pagination {
    margin-top: 15px;
    text-align: right;
  }
  
  .total-amount {
    margin-top: 15px;
    text-align: right;
    font-weight: bold;
  }
  
  /* 新增对话框样式 */
  .full-screen-dialog {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #fff;
    z-index: 2000;
    display: flex;
    flex-direction: column;
  }
  
  .dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    border-bottom: 1px solid #e4e7ed;
  }
  
  .close-btn {
    font-size: 24px;
    cursor: pointer;
  }
  
  .dialog-content {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
  }
  
  .dialog-footer {
    padding: 15px;
    border-top: 1px solid #e4e7ed;
    text-align: right;
  }
  </style>