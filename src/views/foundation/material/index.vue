<template>
  <div class="app-container material-page-container">
    <div class="query-container">
      <div class="form-fields-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" class="query-form">

      <el-row class="query-row-first">
        <el-col :span="24">
          <el-form-item prop="supplierId" class="query-item-inline">
                <div class="query-select-wrapper query-select-wrapper-small" style="width: 150px;">
              <SelectSupplier v-model="queryParams.supplierId"/>
            </div>
          </el-form-item>

          <el-form-item prop="name" class="query-item-inline">
            <el-input
              v-model="queryParams.name"
                  placeholder="支持名称/编码/首字母搜索"
              clearable
              @keyup.enter.native="handleQuery"
                  style="width: 150px"
            />
          </el-form-item>

          <el-form-item prop="udiNo" class="query-item-inline">
            <el-input
              v-model="queryParams.udiNo"
              placeholder="UDI码（支持模糊查询）"
              clearable
              @keyup.enter.native="handleQuery"
                  style="width: 150px"
            />
          </el-form-item>

          <el-form-item prop="registerNo" class="query-item-inline">
            <el-input
              v-model="queryParams.registerNo"
              placeholder="注册证号"
              clearable
              @keyup.enter.native="handleQuery"
              style="width: 150px"
            />
          </el-form-item>

          <el-form-item prop="sunshineCode" class="query-item-inline">
            <el-input
              v-model="queryParams.sunshineCode"
              placeholder="阳采编码"
              clearable
              @keyup.enter.native="handleQuery"
              style="width: 150px"
            />
          </el-form-item>

          <el-form-item prop="factoryId" class="query-item-inline">
            <div class="query-select-wrapper query-select-wrapper-small" style="width: 150px;">
              <SelectFactory v-model="queryParams.factoryId"/>
            </div>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row class="query-row-third">
        <el-col :span="24">
              <el-form-item class="query-item-inline query-item-date">
            <el-date-picker
              v-model="queryParams.beginDate"
              type="date"
              value-format="yyyy-MM-dd"
              placeholder="起始日期"
              clearable
                  style="width: 100px; margin-right: 4px;"
            />
                <span style="margin: 0 2px;">至</span>
            <el-date-picker
              v-model="queryParams.endDate"
              type="date"
              value-format="yyyy-MM-dd"
              placeholder="截止日期"
              clearable
                  style="width: 100px; margin-left: 4px;"
            />
          </el-form-item>

              <el-form-item prop="storeroomId" class="query-item-inline">
                <div class="query-select-wrapper query-select-wrapper-small" style="width: 100px !important;">
                  <SelectWarehouseCategory v-model="queryParams.storeroomId" style="width: 100%"/>
                </div>
              </el-form-item>

              <el-form-item prop="financeCategoryId" class="query-item-inline">
                <div class="query-select-wrapper query-select-wrapper-small" style="width: 100px !important;">
                  <SelectFinanceCategory v-model="queryParams.financeCategoryId" style="width: 100%"/>
                </div>
              </el-form-item>

              <el-form-item prop="locationId" class="query-item-inline">
                <div class="query-select-wrapper query-select-wrapper-small" style="width: 150px;">
                  <SelectLocation v-model="queryParams.locationId"/>
                </div>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row class="query-row-fourth">
            <el-col :span="24">
          <el-form-item prop="isUse" class="query-item-inline">
            <el-select v-model="queryParams.isUse" placeholder="启停用状态" style="width: 110px" clearable>
              <el-option
                v-for="dict in dict.type.is_use_status"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              ></el-option>
            </el-select>
          </el-form-item>

              <el-form-item prop="isGz" class="query-item-inline query-item-compact">
            <el-select v-model="queryParams.isGz" placeholder="高值" style="width: 100px" clearable>
              <el-option
                v-for="dict in dict.type.is_yes_no"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              ></el-option>
            </el-select>
          </el-form-item>

              <el-form-item prop="isFollow" class="query-item-inline query-item-compact">
            <el-select v-model="queryParams.isFollow" placeholder="跟台" style="width: 100px" clearable>
              <el-option
                v-for="dict in dict.type.is_yes_no"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              ></el-option>
            </el-select>
          </el-form-item>

              <el-form-item prop="isBilling" class="query-item-inline query-item-compact">
                <el-select v-model="queryParams.isBilling" placeholder="计费" style="width: 100px" clearable>
                  <el-option
                    v-for="dict in dict.type.is_yes_no"
                    :key="dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  ></el-option>
                </el-select>
              </el-form-item>
        </el-col>
      </el-row>

    </el-form>
      </div>
    </div>
    <el-row :gutter="10" class="mb8" style="padding-top: 0px; margin-top: -8px">
      <el-col :span="1.5">
        <el-button
          type="primary" size="medium"
          @click="handleAdd"
          v-hasPermi="['foundation:material:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary" size="medium"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['foundation:material:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary" size="medium"
          :disabled="single"
          @click="handleDelete"
          v-hasPermi="['foundation:material:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary" size="medium"
          :disabled="multiple"
          @click="handleUpdateReferred"
          v-hasPermi="['foundation:material:updateReferred']"
        >更新简码</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary" size="medium"
          @click="handleExport"
          v-hasPermi="['foundation:material:export']"
        >导出</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="info"
          plain
          icon="el-icon-upload2"
          size="medium"
          @click="handleMaterialImport('add')"
          v-hasPermi="['foundation:material:import']"
          >新增导入</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="info"
          plain
          icon="el-icon-upload2"
          size="medium"
          @click="handleMaterialImport('update')"
          v-hasPermi="['foundation:material:import']"
        >更新导入</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary" size="medium"
          :disabled="!queryParams.supplierId"
          @click="handlePushArchive"
          v-hasPermi="['foundation:material:push']"
        >推送档案</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          size="medium"
          @click="handleQuery"
        >搜索</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList" :columns="columns"></right-toolbar>
    </el-row>

      <el-table v-loading="loading" :data="materialList" :row-class-name="materialIndex" @selection-change="handleSelectionChange" height="60vh" border stripe>
      <el-table-column type="selection" width="55" align="center" fixed="left" />
      <el-table-column type="index" label="序号" align="center" width="80" key="index" v-if="columns[0].visible" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column label="耗材编码" align="left" prop="code" width="160" key="code" v-if="columns[1].visible" resizable class-name="material-top-cell">
        <template slot-scope="scope">
          <div class="material-cell-top-left">{{ scope.row.code }}</div>
        </template>
      </el-table-column>
      <el-table-column label="耗材名称" align="left" prop="name" width="240" key="name" v-if="columns[2].visible" resizable class-name="material-top-cell">
        <template slot-scope="scope">
          <div class="material-cell-top-left">{{ scope.row.name }}</div>
        </template>
      </el-table-column>
      <el-table-column label="规格" align="left" prop="speci" width="200" key="speci" v-if="columns[3].visible" resizable class-name="material-top-cell">
        <template slot-scope="scope">
          <div class="material-cell-top-left">{{ scope.row.speci }}</div>
        </template>
      </el-table-column>
      <el-table-column label="型号" align="left" prop="model" width="200" key="model" v-if="columns[4].visible" resizable class-name="material-top-cell">
        <template slot-scope="scope">
          <div class="material-cell-top-left">{{ scope.row.model }}</div>
        </template>
      </el-table-column>
      <el-table-column label="医保编码" align="left" prop="medicalNo" width="190" key="medicalNo" v-if="columns[23].visible" resizable class-name="material-top-cell">
        <template slot-scope="scope">
          <div class="material-cell-top-left">{{ scope.row.medicalNo }}</div>
        </template>
      </el-table-column>
      <el-table-column label="注册证号" align="left" prop="registerNo" width="190" key="registerNo" v-if="columns[24].visible" resizable class-name="material-top-cell">
        <template slot-scope="scope">
          <div class="material-cell-top-left">{{ scope.row.registerNo }}</div>
        </template>
      </el-table-column>
      <el-table-column label="财务分类" align="left" prop="fdFinanceCategory.financeCategoryName" width="220" key="financeCategory" v-if="columns[25].visible" resizable class-name="material-top-cell">
        <template slot-scope="scope">
          <div class="material-cell-top-left">
            {{ scope.row.fdFinanceCategory && scope.row.fdFinanceCategory.financeCategoryName ? scope.row.fdFinanceCategory.financeCategoryName : '' }}
          </div>
        </template>
      </el-table-column>
      <el-table-column label="价格" align="right" prop="price" width="130" key="price" v-if="columns[5].visible" resizable class-name="material-price-cell">
        <template slot-scope="scope">
          <div class="material-cell-price-right">{{ formatPrice4(scope.row.price) }}</div>
        </template>
      </el-table-column>
      <el-table-column label="单位" align="center" prop="fdUnit.unitName" width="80" key="unit" v-if="columns[6].visible" show-overflow-tooltip resizable/>
      <el-table-column label="生产厂家" align="left" prop="fdFactory.factoryName" width="220" key="factory" v-if="columns[7].visible" resizable class-name="material-top-cell">
        <template slot-scope="scope">
          <div class="material-cell-top-left">{{ scope.row.fdFactory && scope.row.fdFactory.factoryName ? scope.row.fdFactory.factoryName : '' }}</div>
        </template>
      </el-table-column>
      <el-table-column label="供应商" align="left" prop="supplier.name" width="240" key="supplier" v-if="columns[8].visible" resizable class-name="material-top-cell">
        <template slot-scope="scope">
          <div class="material-cell-top-left">{{ scope.row.supplier && scope.row.supplier.name ? scope.row.supplier.name : '' }}</div>
        </template>
      </el-table-column>
      <el-table-column label="库房分类" align="center" prop="fdWarehouseCategory.warehouseCategoryName" width="120" key="warehouseCategory" v-if="columns[9].visible" show-overflow-tooltip resizable/>
      <el-table-column label="储存方式" align="center" prop="isWay" width="100" key="storageMethod" v-if="columns[10].visible" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.way_status" :value="scope.row.isWay"/>
        </template>
      </el-table-column>
      <el-table-column label="货位" align="center" prop="fdLocation.locationName" width="120" key="location" v-if="columns[11].visible" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.fdLocation && scope.row.fdLocation.locationName">{{ scope.row.fdLocation.locationName }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="启用" align="center" prop="isUse" width="100" key="isUse" v-if="columns[12].visible" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.isUse === '1' || scope.row.isUse === 1 ? '是' : '否' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="高值" align="center" prop="isGz" width="80" key="isGz" v-if="columns[13].visible" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.is_yes_no" :value="scope.row.isGz"/>
        </template>
      </el-table-column>
      <el-table-column label="跟台" align="center" prop="isFollow" width="80" key="isFollow" v-if="columns[14].visible" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.is_yes_no" :value="scope.row.isFollow"/>
        </template>
      </el-table-column>
      <el-table-column label="计费" align="center" prop="isBilling" width="80" key="isBilling" v-if="columns[19].visible" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.isBilling === '1' || scope.row.isBilling === 1 ? '是' : '否' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="品牌" align="center" prop="brand" width="120" key="brand" v-if="columns[22].visible" show-overflow-tooltip resizable/>
      <el-table-column label="创建日期" align="center" prop="createTime" width="100" key="createTime" v-if="columns[21].visible" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="180" fixed="right">
        <template slot-scope="scope">
          <el-button
            size="small"
            type="text"
            @click="handleView(scope.row)"
            v-hasPermi="['foundation:material:query']"
          >查看详情</el-button>
          <el-button
            size="small"
            type="text"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['foundation:material:edit']"
          >修改</el-button>
          <el-button
            size="small"
            type="text"
            @click="handleDelete(scope.row)"
            v-hasPermi="['foundation:material:remove']"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      :page-sizes="[10, 20, 30, 50, 100, 500, 1000]"
      @pagination="getList"
    />

    <!-- 添加或修改耗材产品局部弹窗 -->
    <div v-if="open" class="local-modal-mask">
      <div class="local-modal-content material-modal-content">
        <div class="modal-header">
          <div class="modal-title">{{ title }}</div>
          <el-button size="medium" @click="cancel" class="close-btn">关闭</el-button>
          </div>
        <el-tabs v-model="activeTab" @tab-click="onTabClick">
          <!-- 基本信息 -->
          <el-tab-pane label="基本信息" name="form">
            <el-form ref="form" :model="form" :rules="rules" label-width="120px" :disabled="isViewMode">
              <!-- 第一行 -->
          <el-row :gutter="20">
                <el-col :span="4">
                  <el-form-item label="耗材编码：" prop="code">
                <el-input
                  v-model="form.code"
                  :disabled="isDisabled || form.id != null || isHsThirdTenant"
                  :placeholder="isHsThirdTenant ? '耗材编码由系统自动生成' : '耗材编码（留空自动生成6位数字，手工输入可为任意长度）'"
                  @blur="validateCode"
                  @input="handleCodeInput"
                />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="耗材名称：" prop="name">
                <el-input v-model="form.name" @input="nameChange" placeholder="耗材名称" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="名称简码：" prop="referredName">
                <el-input v-model="form.referredName" :disabled="true" placeholder="名称简码" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="供应商：" prop="supplierId">
                <SelectSupplier v-model="form.supplierId" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="生产厂家：" prop="factoryId">
                    <SelectFactory v-model="form.factoryId"/>
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="规格：" prop="speci">
                    <el-input v-model="form.speci" placeholder="规格" />
              </el-form-item>
            </el-col>
          </el-row>

              <!-- 第二行 -->
          <el-row :gutter="20">
                <el-col :span="4">
                  <el-form-item label="型号：" prop="model">
                    <el-input v-model="form.model" placeholder="型号" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="单位：" prop="unitId">
                <SelectUnit v-model="form.unitId" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="单价：" prop="price">
                    <el-input v-model="form.price" placeholder="请输入单价" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="库房分类：" prop="storeroomId">
                    <SelectWarehouseCategory v-model="form.storeroomId" @input="onStoreroomChange"/>
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="财务分类：" prop="financeCategoryId">
                    <SelectFinanceCategory v-model="form.financeCategoryId"/>
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="产地：" prop="producer">
                    <el-input v-model="form.producer" placeholder="产地" />
              </el-form-item>
            </el-col>
          </el-row>

              <!-- 第三行 -->
          <el-row :gutter="20">
                <el-col :span="4">
                  <el-form-item label="通用名称：" prop="useName">
                    <el-input v-model="form.useName" placeholder="通用名称" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="注册证名称：" prop="registerName">
                    <el-input v-model="form.registerName" placeholder="注册证名称" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="注册证号：" prop="registerNo">
                    <el-input v-model="form.registerNo" placeholder="注册证号" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="注册证有效期：" prop="periodDate">
                <el-date-picker clearable
                                v-model="form.periodDate"
                                type="date"
                                value-format="yyyy-MM-dd"
                                    style="width:100%"
                                placeholder="请选择注册证有效期">
                </el-date-picker>
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="注册证级别：">
                    <el-select v-model="form.registerLevel" placeholder="请选择注册证级别" style="width: 100%">
                      <el-option
                        v-for="dict in dict.type.register_level_status"
                        :key="dict.value"
                        :label="dict.label"
                        :value="dict.value"
                      ></el-option>
                    </el-select>
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="货位：" prop="locationId">
                    <SelectLocation v-model="form.locationId" />
              </el-form-item>
            </el-col>
          </el-row>

              <!-- 第四行 -->
          <el-row :gutter="20">
                <el-col :span="4">
                  <el-form-item label="医保编码：" prop="medicalNo">
                <el-input v-model="form.medicalNo" placeholder="医保编码" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="医保名称：" prop="medicalName">
                    <el-input v-model="form.medicalName" placeholder="医保名称" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="销售价：" prop="salePrice">
                    <el-input v-model="form.salePrice" placeholder="销售价" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="中标价格：" prop="successfulPrice">
                    <el-input v-model="form.successfulPrice" placeholder="中标价格" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="中标号：" prop="successfulNo">
                    <el-input v-model="form.successfulNo" placeholder="中标号" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="招标类别：" prop="successfulType">
                    <el-input v-model="form.successfulType" placeholder="招标类别" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="入选原因：" prop="selectionReason">
                    <el-input v-model="form.selectionReason" type="textarea" :rows="2" placeholder="入选原因" />
                  </el-form-item>
                </el-col>
          </el-row>

              <!-- 第五行 -->
          <el-row :gutter="20">
                <el-col :span="4">
                  <el-form-item label="包装规格：" prop="packageSpeci">
                    <el-input v-model="form.packageSpeci" placeholder="包装规格" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="储存方式：" prop="isWay">
                    <el-select v-model="form.isWay" placeholder="请选择储存方式" style="width: 100%">
                  <el-option
                        v-for="dict in dict.type.way_status"
                    :key="dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="品牌：" prop="brand">
                    <el-input v-model="form.brand" placeholder="品牌" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="用途：" prop="useto">
                    <el-input v-model="form.useto" placeholder="用途" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="材质：" prop="quality">
                    <el-input v-model="form.quality" placeholder="材质" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="功能：" prop="function">
                    <el-input v-model="form.function" placeholder="功能" />
                  </el-form-item>
                </el-col>
          </el-row>

              <!-- 第六行 -->
          <el-row :gutter="20">
                <el-col :span="4">
                  <el-form-item label="UDI码：" prop="udiNo">
                <el-input v-model="form.udiNo" placeholder="UDI码" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="阳光平台编码：" prop="sunshineCode">
                <el-input v-model="form.sunshineCode" placeholder="阳光平台编码" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="耗材级别：">
                    <el-select v-model="form.materialLevel" placeholder="请选择耗材级别" style="width: 100%">
                  <el-option
                        v-for="dict in dict.type.material_level_status"
                    :key="dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="风险级别：">
                    <el-select v-model="form.riskLevel" placeholder="请选择风险级别" style="width: 100%">
                  <el-option
                        v-for="dict in dict.type.risk_level_status"
                    :key="dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="急救类型：" prop="firstaidLevel">
                    <el-select v-model="form.firstaidLevel" placeholder="请选择急救类型" style="width: 100%">
                  <el-option
                        v-for="dict in dict.type.firstaid_level_status"
                    :key="dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="医用级别：" prop="doctorLevel">
                    <el-select v-model="form.doctorLevel" placeholder="请选择医用级别" style="width: 100%">
                  <el-option
                        v-for="dict in dict.type.doctor_level_status"
                    :key="dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

              <!-- 第七行 -->
          <el-row :gutter="20">
                <el-col :span="4">
                  <el-form-item label="贯标码：" prop="countryNo">
                    <el-input v-model="form.countryNo" placeholder="贯标码" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="许可证编号：" prop="permitNo">
                    <el-input v-model="form.permitNo" placeholder="许可证编号" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="商品说明：" prop="description">
                    <el-input v-model="form.description" placeholder="商品说明" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="备注：" prop="countryName">
                <el-input v-model="form.countryName" placeholder="备注" />
                  </el-form-item>
                </el-col>
          </el-row>

              <!-- 第八行 - 开关控件容器 -->
          <el-row :gutter="20">
            <el-col :span="24">
              <div class="switch-container">
                <div class="switch-row">
                  <el-form-item label="" prop="isUse" class="switch-form-item">
                    <div class="switch-with-label-left">
                      <span class="switch-label" :class="{ 'active': form.isUse === '1' }">启用</span>
                      <el-switch
                        v-model="form.isUse"
                        :active-value="'1'"
                        :inactive-value="'2'"
                        @change="onIsUseChange"
                      ></el-switch>
                    </div>
                  </el-form-item>
                  <el-form-item v-if="form.id && form.isUse !== originalIsUse" label="状态变更原因：" prop="statusChangeReason" class="status-reason-form-item">
                    <el-input v-model="form.statusChangeReason" type="textarea" :rows="2" :placeholder="form.isUse === '1' ? '请填写启用原因' : '请填写停用原因'" />
                  </el-form-item>
                  <el-form-item label="" prop="isTemporaryPurchase" class="switch-form-item">
                    <div class="switch-with-label-left">
                      <span class="switch-label" :class="{ 'active': form.isTemporaryPurchase === '1' }" style="white-space: nowrap;">临购</span>
                      <el-switch
                        v-model="form.isTemporaryPurchase"
                        :active-value="'1'"
                        :inactive-value="'2'"
                      ></el-switch>
                    </div>
                  </el-form-item>
                </div>
                <div class="switch-row">
                  <el-form-item label="" prop="isBilling" class="switch-form-item">
                    <div class="switch-with-label-left">
                      <span class="switch-label" :class="{ 'active': form.isBilling === '1' }">计费</span>
                      <el-switch
                        v-model="form.isBilling"
                        :active-value="'1'"
                        :inactive-value="'2'"
                      ></el-switch>
                    </div>
                  </el-form-item>
                  <el-form-item label="" prop="isServiceFee" class="switch-form-item">
                    <div class="switch-with-label-left">
                      <span class="switch-label" :class="{ 'active': form.isServiceFee === '1' }">服务费</span>
                      <el-switch
                        v-model="form.isServiceFee"
                        :active-value="'1'"
                        :inactive-value="'2'"
                      ></el-switch>
                    </div>
                  </el-form-item>
                  <el-form-item label="" prop="isGz" class="switch-form-item">
                    <div class="switch-with-label-left">
                      <span class="switch-label" :class="{ 'active': form.isGz === '1' }">高值</span>
                      <el-switch
                        v-model="form.isGz"
                        :active-value="'1'"
                        :inactive-value="'2'"
                      ></el-switch>
                    </div>
                  </el-form-item>
                  <el-form-item label="" prop="isFollow" class="switch-form-item">
                    <div class="switch-with-label-left">
                      <span class="switch-label" :class="{ 'active': form.isFollow === '1' }">跟台</span>
                      <el-switch
                        v-model="form.isFollow"
                        :active-value="'1'"
                        :inactive-value="'2'"
                      ></el-switch>
                    </div>
                  </el-form-item>
                  <el-form-item label="" prop="isMonitor" class="switch-form-item">
                    <div class="switch-with-label-left">
                      <span class="switch-label" :class="{ 'active': form.isMonitor === '1' }" style="white-space: nowrap;">重点监测</span>
                      <el-switch
                        v-model="form.isMonitor"
                        :active-value="'1'"
                        :inactive-value="'2'"
                      ></el-switch>
                    </div>
                  </el-form-item>
                  <el-form-item label="" prop="isCentralizedProcurement" class="switch-form-item">
                    <div class="switch-with-label-left">
                      <span class="switch-label" :class="{ 'active': form.isCentralizedProcurement === '1' }">集采</span>
                      <el-switch
                        v-model="form.isCentralizedProcurement"
                        :active-value="'1'"
                        :inactive-value="'2'"
                      ></el-switch>
                    </div>
                  </el-form-item>
                  <el-form-item label="" prop="isSunshineProcurement" class="switch-form-item">
                    <div class="switch-with-label-left">
                      <span class="switch-label" :class="{ 'active': form.isSunshineProcurement === '1' }">阳采</span>
                      <el-switch
                        v-model="form.isSunshineProcurement"
                        :active-value="'1'"
                        :inactive-value="'2'"
                      ></el-switch>
                    </div>
                  </el-form-item>
                </div>
              </div>
            </el-col>
          </el-row>

              <!-- 第九行 - HIS对照框 -->
          <el-row :gutter="20">
            <el-col :span="24">
              <div class="his-compare-container">
                <div class="his-compare-header">
                  <span class="his-compare-title">HIS对照</span>
                </div>
                <div class="his-compare-content">
                  <el-row :gutter="20">
                <el-col :span="4">
                      <el-form-item label="收费编码：" prop="hisChargeCode">
                        <el-input v-model="form.hisChargeCode" placeholder="收费编码" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                      <el-form-item label="收费规格：" prop="hisChargeSpeci">
                        <el-input v-model="form.hisChargeSpeci" placeholder="收费规格" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="4">
                      <el-form-item label="收费型号：" prop="hisChargeModel">
                        <el-input v-model="form.hisChargeModel" placeholder="收费型号" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="4">
                      <el-form-item label="收费单价：" prop="hisChargePrice">
                        <el-input v-model="form.hisChargePrice" placeholder="收费单价" />
              </el-form-item>
                    </el-col>
                  </el-row>
                  <el-row :gutter="20">
                    <el-col :span="4">
                      <el-form-item label="收费名称：" prop="hisChargeName">
                        <el-input v-model="form.hisChargeName" placeholder="收费名称" />
                      </el-form-item>
                    </el-col>
                  </el-row>
                </div>
              </div>
            </el-col>
          </el-row>

              <!-- 第十行 - 阳光平台信息框 -->
          <el-row :gutter="20">
            <el-col :span="24">
              <div class="sunshine-platform-container">
                <div class="sunshine-platform-header">
                  <span class="sunshine-platform-title">阳光平台信息</span>
                </div>
                <div class="sunshine-platform-content">
          <el-row :gutter="20">
                <el-col :span="4">
                      <el-form-item label="平台id：" prop="sunshinePlatformId">
                        <el-input v-model="form.sunshinePlatformId" placeholder="平台id" />
                  </el-form-item>
                </el-col>
                  </el-row>
                  <el-row :gutter="20">
                <el-col :span="4">
                      <el-form-item label="名称：" prop="sunshineName">
                        <el-input v-model="form.sunshineName" placeholder="名称" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                      <el-form-item label="配送协议编号：" prop="sunshineDeliveryAgreementNo">
                        <el-input v-model="form.sunshineDeliveryAgreementNo" placeholder="配送协议编号" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                      <el-form-item label="配送企业编号：" prop="sunshineDeliveryEnterpriseNo">
                        <el-input v-model="form.sunshineDeliveryEnterpriseNo" placeholder="配送企业编号" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                      <el-form-item label="配送企业：" prop="sunshineDeliveryEnterprise">
                        <el-input v-model="form.sunshineDeliveryEnterprise" placeholder="配送企业" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                      <el-form-item label="包装规格：" prop="sunshinePackagingSpec">
                        <el-input v-model="form.sunshinePackagingSpec" placeholder="包装规格" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="4">
                      <el-form-item label="规格：" prop="sunshineSpec">
                        <el-input v-model="form.sunshineSpec" placeholder="规格" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
                <el-col :span="4">
                      <el-form-item label="单位：" prop="sunshineUnit">
                        <el-input v-model="form.sunshineUnit" placeholder="单位" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                      <el-form-item label="型号：" prop="sunshineModel">
                        <el-input v-model="form.sunshineModel" placeholder="型号" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                      <el-form-item label="单价：" prop="sunshinePrice">
                        <el-input v-model="form.sunshinePrice" placeholder="单价" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                      <el-form-item label="厂家编号：" prop="sunshineFactoryNo">
                        <el-input v-model="form.sunshineFactoryNo" placeholder="厂家编号" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                      <el-form-item label="厂家：" prop="sunshineFactory">
                        <el-input v-model="form.sunshineFactory" placeholder="厂家" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                      <el-form-item label="耗材分类代码：" prop="sunshineCategoryCode">
                        <el-input v-model="form.sunshineCategoryCode" placeholder="耗材分类代码" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
                <el-col :span="4">
                      <el-form-item label="交易产品代码：" prop="sunshineProductCode">
                        <el-input v-model="form.sunshineProductCode" placeholder="交易产品代码" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                      <el-form-item label="采购类别：" prop="sunshinePurchaseCategory">
                        <el-input v-model="form.sunshinePurchaseCategory" placeholder="采购类别" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                      <el-form-item label="一级目录：" prop="sunshineFirstLevel">
                        <el-input v-model="form.sunshineFirstLevel" placeholder="一级目录" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                      <el-form-item label="二级目录：" prop="sunshineSecondLevel">
                        <el-input v-model="form.sunshineSecondLevel" placeholder="二级目录" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                      <el-form-item label="三级目录：" prop="sunshineThirdLevel">
                        <el-input v-model="form.sunshineThirdLevel" placeholder="三级目录" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                      <el-form-item label="来源：" prop="sunshineSource">
                        <el-input v-model="form.sunshineSource" placeholder="来源" />
              </el-form-item>
            </el-col>
                  </el-row>
                  <el-row :gutter="20">
                    <el-col :span="4">
                      <el-form-item label="系数：" prop="sunshineCoefficient">
                        <el-input v-model="form.sunshineCoefficient" placeholder="系数" />
                      </el-form-item>
                    </el-col>
                  </el-row>
                </div>
              </div>
            </el-col>
          </el-row>

              <!-- 第十一行 - HRP对照框 -->
          <el-row :gutter="20">
            <el-col :span="24">
              <div class="hrp-compare-container">
                <div class="hrp-compare-header">
                  <span class="hrp-compare-title">HRP对照</span>
                </div>
                <div class="hrp-compare-content">
                  <el-row :gutter="20">
                    <el-col :span="4">
                      <el-form-item label="HRP编码：" prop="hrpCode">
                        <el-input v-model="form.hrpCode" placeholder="HRP编码" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="4">
                      <el-form-item label="HRP规格：" prop="hrpSpeci">
                        <el-input v-model="form.hrpSpeci" placeholder="HRP规格" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="4">
                      <el-form-item label="HRP序号：" prop="hrpSeq">
                        <el-input v-model="form.hrpSeq" placeholder="HRP序号" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="4">
                      <el-form-item label="HRP单位：" prop="hrpUnit">
                        <el-input v-model="form.hrpUnit" placeholder="HRP单位" />
                      </el-form-item>
                    </el-col>
                  </el-row>
                  <el-row :gutter="20">
                    <el-col :span="4">
                      <el-form-item label="HRP单价：" prop="hrpPrice">
                        <el-input v-model="form.hrpPrice" placeholder="HRP单价" />
                      </el-form-item>
                    </el-col>
                  </el-row>
                </div>
              </div>
            </el-col>
          </el-row>

              <!-- 第十行 -->
          <el-row :gutter="20">
          </el-row>

              <!-- 第十一行 -->
          <el-row :gutter="20">
          </el-row>

              <!-- 第十二行 -->
          <el-row :gutter="20">
          </el-row>
          </el-form>
          </el-tab-pane>

          <!-- 产品图片 -->
          <el-tab-pane label="产品图片" name="image">
            <div class="image-tab-content" style="text-align: center; padding: 40px 20px;">
            <div class="material-image-container" style="display: inline-block;">
              <el-upload
                ref="imageUpload"
                :action="imageUploadUrl"
                :headers="imageUploadHeaders"
                :show-file-list="false"
                :on-success="handleImageSuccess"
                :before-upload="beforeImageUpload"
                :auto-upload="true"
                accept="image/*"
                :disabled="isViewMode"
              >
                <div v-if="form.imageUrl" class="material-image-preview-large" slot="trigger">
                  <img :src="form.imageUrl" alt="耗材图片" @click.stop="previewImage" />
                  <div class="image-overlay">
                    <i class="el-icon-zoom-in" @click.stop="previewImage" title="查看图片"></i>
                    <i class="el-icon-delete" @click.stop="removeImage" title="删除图片"></i>
                  </div>
                </div>
                <div v-else class="material-image-placeholder-large" slot="trigger">
                  <i class="el-icon-plus"></i>
                  <div style="font-size: 14px; color: #999; margin-top: 10px;">点击上传图片</div>
                  <div style="font-size: 12px; color: #ccc; margin-top: 5px;">支持 JPG、PNG 格式，大小不超过 2MB</div>
                </div>
              </el-upload>
              <div v-if="form.imageUrl && !isViewMode" style="margin-top: 20px;">
                <el-button type="primary" @click="previewImage">查看图片</el-button>
                <el-button type="primary" @click="saveImage">保存</el-button>
                <el-button type="primary" @click="removeImage">删除图片</el-button>
              </div>
              <div v-else-if="form.imageUrl && isViewMode" style="margin-top: 20px;">
                <el-button type="primary" @click="previewImage">查看图片</el-button>
              </div>
            </div>
          </div>
          </el-tab-pane>

          <!-- 启用停用记录（查看详情时显示） -->
          <el-tab-pane v-if="form.id && isViewMode" label="启用停用记录" name="statusLog">
            <div class="log-tab-content">
              <el-table :data="statusLogList" border size="small" max-height="360">
                <el-table-column label="操作类型" width="90" align="center">
                  <template slot-scope="scope">
                    <el-tag :type="scope.row.action === 'enable' ? 'success' : 'danger'" size="small">
                      {{ scope.row.action === 'enable' ? '启用' : '停用' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="actionTime" label="操作时间" width="160" align="center" show-overflow-tooltip />
                <el-table-column prop="operator" label="操作人" width="100" align="center" show-overflow-tooltip />
                <el-table-column prop="reason" label="原因" min-width="200" show-overflow-tooltip />
              </el-table>
              <div v-if="statusLogList.length === 0" class="empty-log-tip">暂无启用停用记录</div>
            </div>
          </el-tab-pane>
          <!-- 变更记录（查看详情时显示，左侧时间轴 + 右侧变更记录表） -->
          <el-tab-pane v-if="form.id && isViewMode" label="变更记录" name="changeLog">
            <div class="log-tab-content change-log-with-timeline">
              <el-row :gutter="16">
                <el-col :span="10">
                  <div class="timeline-panel">
                    <div class="timeline-title">产品档案时间轴</div>
                    <el-timeline v-if="timelineList.length > 0">
                      <el-timeline-item
                        v-for="(item, index) in timelineList"
                        :key="index"
                        :timestamp="item.eventTime"
                        placement="top"
                        :type="item.type === 'enable' ? 'success' : (item.type === 'disable' ? 'danger' : 'primary')"
                        :color="item.type === 'enable' ? '#67c23a' : (item.type === 'disable' ? '#f56c6c' : '#409eff')"
                      >
                        <div class="timeline-item-title">{{ item.title }}</div>
                        <div v-if="item.operator" class="timeline-item-meta">操作人：{{ item.operator }}</div>
                        <div v-if="item.description" class="timeline-item-desc">{{ item.description }}</div>
                      </el-timeline-item>
                    </el-timeline>
                    <div v-else class="empty-log-tip">暂无历史记录</div>
                  </div>
                </el-col>
                <el-col :span="14">
                  <div class="change-log-panel">
                    <div class="timeline-title">变更明细</div>
                    <el-table :data="changeLogList" border size="small" max-height="360">
                      <el-table-column prop="changeTime" label="变更时间" width="160" align="center" show-overflow-tooltip />
                      <el-table-column prop="operator" label="操作人" width="100" align="center" show-overflow-tooltip />
                      <el-table-column prop="fieldLabel" label="字段" width="100" align="center" show-overflow-tooltip />
                      <el-table-column prop="oldValue" label="原值" min-width="120" show-overflow-tooltip />
                      <el-table-column prop="newValue" label="新值" min-width="120" show-overflow-tooltip />
                    </el-table>
                    <div v-if="changeLogList.length === 0" class="empty-log-tip">暂无变更记录</div>
                  </div>
                </el-col>
              </el-row>
            </div>
          </el-tab-pane>
        </el-tabs>

        <div class="dialog-footer" style="text-align:center;margin-top:16px;" v-if="!isViewMode">
          <el-button type="primary" size="medium" @click="submitForm">确 定</el-button>
          <el-button size="medium" @click="cancel">取 消</el-button>
        </div>
        <div class="dialog-footer" style="text-align:center;margin-top:16px;" v-else>
          <el-button size="medium" @click="cancel">关 闭</el-button>
        </div>
      </div>
    </div>

    <!-- 图片预览对话框 -->
    <el-dialog
      title="图片预览"
      :visible.sync="imagePreviewVisible"
      width="800px"
      append-to-body
    >
      <div style="text-align: center;">
        <img :src="imagePreviewUrl" style="max-width: 100%; max-height: 600px;" alt="预览图片" />
      </div>
    </el-dialog>

    <!-- 耗材档案：新增/更新导入 -->
    <div v-if="upload.open" class="local-modal-mask">
      <div class="local-modal-content" style="width: 560px; min-width: 400px; min-height: auto;">
        <div style="font-size:18px;font-weight:bold;margin-bottom:16px;">{{ upload.title }}</div>
        <el-alert
          v-if="upload.mode === 'add'"
          type="warning"
          :closable="false"
          show-icon
          style="margin-bottom:12px;"
          title="新增导入：HIS系统ID 在组织机构内已存在则整单拒绝；请填写 HIS生产厂家ID 或 SPD生产厂家ID；HIS财务分类ID 用于匹配 SPD 财务分类。"
        />
        <el-alert
          v-if="upload.mode === 'update'"
          type="info"
          :closable="false"
          show-icon
          style="margin-bottom:12px;"
          title="更新导入：SPD系统主键须存在且属于本组织机构；仅更新名称、规格、型号、单位、单价、医保代码。"
        />
        <p style="color:#909399;font-size:13px;margin:0 0 12px;line-height:1.5;">
          先整单校验，通过后确认写入。解析结果可预览并导出以便排查。
        </p>
        <el-upload
          ref="materialImportUpload"
          :limit="1"
          accept=".xlsx, .xls"
          :disabled="upload.isUploading"
          :http-request="noopMaterialImportUpload"
          :on-change="handleMaterialImportFileChange"
          :on-remove="handleMaterialImportFileRemove"
          :auto-upload="false"
          drag
        >
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">将文件拖到此处，或<em>点击选择</em></div>
          <div class="el-upload__tip text-center" slot="tip">
            <span>仅允许 xls、xlsx。</span>
            <el-link type="primary" :underline="false" style="font-size:12px;vertical-align: baseline;" @click="downloadMaterialImportTemplate">下载模板</el-link>
          </div>
        </el-upload>
        <div class="dialog-footer" style="text-align:right;margin-top:16px;">
          <el-button type="primary" :loading="upload.isUploading" @click="submitMaterialImportFlow">校验并导入</el-button>
          <el-button @click="closeMaterialImport">取 消</el-button>
        </div>
      </div>
    </div>

    <el-dialog
      :title="importPreview.title"
      :visible.sync="importPreview.visible"
      width="90%"
      top="5vh"
      append-to-body
      @close="importPreview.rows = []; importPreview.columns = []"
    >
      <div style="margin-bottom:10px;">
        <el-button type="primary" size="small" icon="el-icon-download" :disabled="!importPreview.rows.length" @click="exportMaterialImportPreview">导出解析结果</el-button>
      </div>
      <el-table :data="importPreview.rows" border max-height="520" size="small" style="width:100%">
        <el-table-column
          v-for="col in importPreview.columns"
          :key="col"
          :prop="col"
          :label="col"
          min-width="120"
          show-overflow-tooltip
        />
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button @click="importPreview.visible = false">关 闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { listMaterial, listMaterialAll, getMaterial, delMaterial, addMaterial, updateMaterial, pushMaterialArchive, updateMaterialReferred, disableMaterial, enableMaterial, getMaterialStatusLog, getMaterialChangeLog, getMaterialTimeline, validateMaterialImportAdd, importMaterialAddData, validateMaterialImportUpdate, importMaterialUpdateData } from "@/api/foundation/material";
import { exportPreviewRowsToXlsx } from "@/utils/importPreviewExport";
import { mapGetters } from "vuex";
import SelectSupplier from '@/components/SelectModel/SelectSupplier';
import SelectFactory from '@/components/SelectModel/SelectFactory';
import SelectFinanceCategory from "@/components/SelectModel/SelectFinanceCategory";
import SelectWarehouseCategory from "@/components/SelectModel/SelectWarehouseCategory";
import SelectUnit from "@/components/SelectModel/SelectUnit";
import SelectLocation from "@/components/SelectModel/SelectLocation";
import { getWarehouseCategory } from "@/api/foundation/warehouseCategory";
import { getFinanceCategory } from "@/api/foundation/financeCategory";
import { pinyin } from 'pinyin-pro'
import { getToken } from "@/utils/auth";

export default {
  name: "Material",
  dicts: ['is_use_status', 'is_yes_no','way_status','material_level_status', 'register_level_status','risk_level_status','firstaid_level_status','doctor_level_status'],
  components: {SelectSupplier,SelectFactory,SelectFinanceCategory,SelectWarehouseCategory,SelectUnit,SelectLocation},
  computed: {
    ...mapGetters(['customerId']),
    isHsThirdTenant() {
      return this.customerId === 'hengsui-third-001';
    },
    isViewMode() {
      return this.dialogMode === 'view';
    }
  },
  data() {
    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      isDisabled: false,
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 耗材产品表格数据
      materialList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 弹窗模式：add/edit/view
      dialogMode: 'add',
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        code: undefined,
        name: undefined,
        supplierId: undefined,
        speci: undefined,
        model: undefined,
        price: undefined,
        isGz: '', // 默认全部
        storeroomId: undefined,
        financeCategoryId: undefined,
        factoryId: undefined,
        locationId: undefined,
        isFollow: '', // 默认全部
        isBilling: '', // 默认全部
        isUse: '', // 默认全部（启停用状态）
        udiNo: undefined,
        registerNo: undefined,
        sunshineCode: undefined,
        nameSearch: undefined, // 用于名称/编码/首字母综合搜索
        beginDate: undefined,
        endDate: undefined,
      },
      // 表单参数
      form: {},
      // 编辑时原始启用状态，用于检测是否变更并要求填写原因
      originalIsUse: null,
      // 启用停用记录、变更记录、时间轴（编辑弹窗内 Tab 使用）
      statusLogList: [],
      changeLogList: [],
      timelineList: [],
      // 显隐列数据
      columns: [
        { key: 0, label: `序号`, visible: true },
        { key: 1, label: `耗材编码`, visible: true },
        { key: 2, label: `耗材名称`, visible: true },
        { key: 3, label: `规格`, visible: true },
        { key: 4, label: `型号`, visible: true },
        { key: 5, label: `价格`, visible: true },
        { key: 6, label: `单位`, visible: true },
        { key: 7, label: `生产厂家`, visible: true },
        { key: 8, label: `供应商`, visible: true },
        { key: 9, label: `库房分类`, visible: true },
        { key: 10, label: `储存方式`, visible: true },
        { key: 11, label: `货位`, visible: true },
        { key: 12, label: `启用`, visible: true },
        { key: 13, label: `高值`, visible: true },
        { key: 14, label: `跟台`, visible: true },
        { key: 15, label: `重点监测`, visible: false },
        { key: 16, label: `集采`, visible: false },
        { key: 17, label: `阳采`, visible: false },
        { key: 18, label: `临购`, visible: false },
        { key: 19, label: `计费`, visible: true },
        { key: 20, label: `服务费`, visible: false },
        { key: 21, label: `创建日期`, visible: true },
        { key: 22, label: `品牌`, visible: false },
        { key: 23, label: `医保编码`, visible: true },
        { key: 24, label: `注册证号`, visible: true },
        { key: 25, label: `财务分类`, visible: true }
      ],
      // 表单校验：仅耗材名称必填；单价若填写则校验为数字
      rules: {
        code: [
          { validator: (rule, value, callback) => {
            if (!value || !String(value).trim()) {
              callback();
              return;
            }
            listMaterial({ code: value, pageNum: 1, pageSize: 1 }).then(response => {
              if (response.rows && response.rows.length > 0) {
                const existingMaterial = response.rows[0];
                if (!this.form.id || existingMaterial.id !== this.form.id) {
                  callback(new Error('该耗材编码已存在，请使用其他编码'));
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
        name: [
          { required: true, message: "耗材名称不能为空", trigger: "blur" }
        ],
        storeroomId: [
          {
            validator: (rule, value, callback) => {
              if (this.isHsThirdTenant && (value === null || value === undefined || value === '')) {
                callback(new Error('衡水三院新增产品档案必须选择库房分类'));
                return;
              }
              callback();
            },
            trigger: "change"
          }
        ],
        price: [
          { validator: (rule, value, callback) => {
            if (value === '' || value === null || value === undefined) {
              callback();
              return;
            }
            const n = Number(value);
            if (Number.isNaN(n)) {
              callback(new Error('单价请输入有效数字'));
            } else {
              callback();
            }
          }, trigger: "blur" }
        ]
      },
      upload: {
        open: false,
        title: "",
        isUploading: false,
        mode: "add",
        pendingFile: null
      },
      importPreview: {
        visible: false,
        title: "导入解析结果",
        rows: [],
        columns: []
      },
      // 图片上传配置
      imageUploadUrl: process.env.VUE_APP_BASE_API + "/common/upload",
      imageUploadHeaders: { Authorization: "Bearer " + getToken() },
      imagePreviewVisible: false,
      imagePreviewUrl: '',
      // 当前激活的标签页：'form' 表单视图，'image' 图片视图
      activeTab: 'form'
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询耗材产品列表 */
    getList() {
      this.loading = true;
      listMaterial(this.queryParams).then(response => {
        this.materialList = response.rows;
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
        id: null,
        code: null,
        name: null,
        supplierId: null,
        speci: null,
        model: null,
        price: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        isGz: '2', // 默认否
        isBilling: '2', // 默认否
        isFollow: '2', // 默认否
        isMonitor: '2', // 默认否
        isCentralizedProcurement: '2', // 默认否
        isSunshineProcurement: '2', // 默认否
        isTemporaryPurchase: '2', // 默认否
        isServiceFee: '2', // 默认否
        isUse: '2', // 默认停用
        beginDate: null,
        endDate: null,
        imageUrl: null,
        sunshineCode: null,
        locationId: null,
        hisChargeCode: null,
        hisChargeName: null,
        hisChargeSpeci: null,
        hisChargeModel: null,
        hisChargePrice: null,
        hrpCode: null,
        hrpSpeci: null,
        hrpSeq: null,
        hrpUnit: null,
        hrpPrice: null,
        sunshinePlatformId: null,
        sunshineName: null,
        sunshineDeliveryAgreementNo: null,
        sunshineDeliveryEnterpriseNo: null,
        sunshineDeliveryEnterprise: null,
        sunshinePackagingSpec: null,
        sunshineSpec: null,
        sunshineUnit: null,
        sunshineModel: null,
        sunshinePrice: null,
        sunshineFactoryNo: null,
        sunshineFactory: null,
        sunshineCategoryCode: null,
        sunshineProductCode: null,
        sunshinePurchaseCategory: null,
        sunshineFirstLevel: null,
        sunshineSecondLevel: null,
        sunshineThirdLevel: null,
        sunshineSource: null,
        sunshineCoefficient: null,
        selectionReason: null
      };
      this.originalIsUse = null;
      this.statusLogList = [];
      this.changeLogList = [];
      this.timelineList = [];
      this.resetForm("form");
    },
    nameChange(val){
      if (!val || val.trim() === '') {
        this.form.referredName = '';
        return;
      }

      // 提取每个字符的首字母
      const pinYinCode = pinyin(val, {
        pattern: 'first',
        toneType: 'none',
        type: 'array',
      }).join('').toUpperCase();

      this.form.referredName = pinYinCode;
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      // 处理耗材名称搜索：支持编码、名称、首字母搜索
      this.processNameSearch();
      this.getList();
    },
    /** 处理名称搜索参数 */
    processNameSearch() {
      const nameValue = this.queryParams.name;

      if (!nameValue || nameValue.trim() === '') {
        // 清空搜索参数
        this.queryParams.code = undefined;
        this.queryParams.name = undefined;
        this.queryParams.nameSearch = undefined;
        return;
      }

      const trimmedValue = nameValue.trim();

      // 判断输入类型
      // 1. 如果全是数字或字母数字组合，可能是编码
      const isCodePattern = /^[A-Za-z0-9]+$/.test(trimmedValue);
      // 2. 如果包含中文，是名称搜索
      const hasChinese = /[\u4e00-\u9fa5]/.test(trimmedValue);
      // 3. 如果全是字母，可能是首字母
      const isLetterOnly = /^[A-Za-z]+$/.test(trimmedValue);

      // 生成首字母（用于首字母搜索）
      let pinyinCode = '';
      if (hasChinese) {
        // 提取每个字符的首字母
        pinyinCode = pinyin(trimmedValue, {
          pattern: 'first',
          toneType: 'none',
          type: 'array',
        }).join('').toUpperCase();
      } else if (isLetterOnly) {
        // 如果输入的是纯字母，直接作为首字母搜索
        pinyinCode = trimmedValue.toUpperCase();
      }

      // 设置搜索参数
      // 如果看起来像编码，同时设置 code 参数
      if (isCodePattern && !hasChinese) {
        this.queryParams.code = trimmedValue;
      } else {
        this.queryParams.code = undefined;
      }

      // 设置名称搜索（支持中文名称模糊搜索）
      if (hasChinese) {
        this.queryParams.name = trimmedValue;
      } else {
        this.queryParams.name = undefined;
      }

      // 设置首字母搜索参数（如果有）
      if (pinyinCode) {
        this.queryParams.nameSearch = pinyinCode;
      } else {
        this.queryParams.nameSearch = undefined;
      }
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.beginDate = null;
      this.queryParams.endDate = null;
      this.queryParams.isUse = ''; // 重置为全部
      this.queryParams.isGz = '';
      this.queryParams.isFollow = '';
      this.queryParams.isBilling = '';
      this.handleQuery();
    },
    handleMaterialImport(mode) {
      this.upload.mode = mode === "update" ? "update" : "add";
      this.upload.title = this.upload.mode === "update" ? "耗材档案更新导入" : "耗材档案新增导入";
      this.upload.pendingFile = null;
      this.upload.open = true;
      this.$nextTick(() => {
        if (this.$refs.materialImportUpload) this.$refs.materialImportUpload.clearFiles();
      });
    },
    closeMaterialImport() {
      this.upload.open = false;
      this.upload.pendingFile = null;
      if (this.$refs.materialImportUpload) this.$refs.materialImportUpload.clearFiles();
    },
    noopMaterialImportUpload() {},
    handleMaterialImportFileChange(file) {
      this.upload.pendingFile = file && file.raw ? file.raw : null;
    },
    handleMaterialImportFileRemove() {
      this.upload.pendingFile = null;
    },
    downloadMaterialImportTemplate() {
      const api = this.upload.mode === "update" ? "foundation/material/importUpdateTemplate" : "foundation/material/importAddTemplate";
      const name = this.upload.mode === "update" ? "耗材档案更新导入模板.xlsx" : "耗材档案新增导入模板.xlsx";
      this.download(api, {}, name);
    },
    showMaterialImportPreviewFromPayload(payload, title) {
      const rows = (payload && payload.previewRows) || [];
      this.importPreview.title = title || "导入解析结果";
      this.importPreview.rows = rows;
      this.importPreview.columns = rows.length ? Object.keys(rows[0]) : [];
      this.importPreview.visible = true;
    },
    async exportMaterialImportPreview() {
      try {
        const name = (this.upload.mode === "update" ? "material_update" : "material_add") + "_preview_" + new Date().getTime() + ".xlsx";
        await exportPreviewRowsToXlsx(this.importPreview.rows, name);
        this.$modal.msgSuccess("已导出");
      } catch (e) {
        this.$modal.msgError(e.message || "导出失败");
      }
    },
    async submitMaterialImportFlow() {
      const f = this.upload.pendingFile;
      if (!f) {
        this.$modal.msgWarning("请先选择 Excel 文件");
        return;
      }
      this.upload.isUploading = true;
      try {
        const isUpdate = this.upload.mode === "update";
        const res = isUpdate ? await validateMaterialImportUpdate(f) : await validateMaterialImportAdd(f);
        const d = res.data || {};
        this.showMaterialImportPreviewFromPayload(d, isUpdate ? "耗材档案更新导入 — 解析结果" : "耗材档案新增导入 — 解析结果");
        if (!d.valid) {
          const errs = (d.errors && d.errors.length) ? d.errors.join("<br/>") : (res.msg || "校验失败");
          this.$alert("<div style='overflow:auto;max-height:60vh'>" + errs + "</div>", "校验未通过", { dangerouslyUseHTMLString: true });
          return;
        }
        const tc = d.totalRows != null ? d.totalRows : 0;
        await this.$modal.confirm("校验已通过。共 " + tc + " 行数据，确认后写入数据库，是否继续？");
        const res2 = isUpdate ? await importMaterialUpdateData(f, true) : await importMaterialAddData(f, true);
        const d2 = res2.data || {};
        this.showMaterialImportPreviewFromPayload(d2, isUpdate ? "耗材档案更新导入 — 导入结果" : "耗材档案新增导入 — 导入结果");
        this.$alert("<div style='overflow:auto;max-height:60vh;padding:10px 20px 0'>" + res2.msg + "</div>", "导入结果", { dangerouslyUseHTMLString: true });
        this.closeMaterialImport();
        this.getList();
      } catch (e) {
        if (e !== "cancel" && e !== "close") {
          /* request 已提示 */
        }
      } finally {
        this.upload.isUploading = false;
      }
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 按库房分类规则生成编码（衡水三院：GZ/DZ/SJ+5位；其他租户：6位数字） */
    async generateCode() {
      if (this.isHsThirdTenant) {
        if (!this.form.storeroomId) {
          return '';
        }
        try {
          const wcResp = await getWarehouseCategory(this.form.storeroomId);
          const wc = wcResp && wcResp.data ? wcResp.data : null;
          const prefix = this.resolveHsPrefixByWarehouseName(wc && wc.warehouseCategoryName ? wc.warehouseCategoryName : '');
          if (prefix) {
            const response = await listMaterialAll({});
            const materialList = response.rows || response.data || [];
            const reg = new RegExp("^" + prefix + "(\\d{5})$");
            let max = 0;
            materialList.forEach(item => {
              const code = (item && item.code ? String(item.code) : '').toUpperCase();
              const m = code.match(reg);
              if (m) {
                const n = parseInt(m[1], 10);
                if (!Number.isNaN(n) && n > max) max = n;
              }
            });
            const next = Math.min(max + 1, 99999);
            return `${prefix}${String(next).padStart(5, '0')}`;
          }
        } catch (e) {
          console.error('按库房分类生成编码失败:', e);
        }
      }

      // 查询所有耗材编码，找出最大的6位数字编码
      try {
        const response = await listMaterialAll({});
        const materialList = response.rows || response.data || [];
        const codes = materialList
          .map(item => item.code)
          .filter(code => code && /^\d{6}$/.test(code))
          .map(code => parseInt(code))
          .filter(num => !isNaN(num) && num >= 100000 && num <= 999999);

        if (codes.length > 0) {
          const maxCode = Math.max(...codes);
          const nextCode = maxCode + 1;
          // 确保不超过999999
          if (nextCode <= 999999) {
            return String(nextCode).padStart(6, '0');
          }
        }
      } catch (error) {
        console.error('查询编码失败:', error);
      }

      // 如果没有现有编码或已达到最大值，从100000开始
      return '100000';
    },
    resolveHsPrefixByWarehouseName(name) {
      const n = (name || '').trim();
      if (n.includes('高值耗材')) return 'GZ';
      if (n.includes('低值耗材')) return 'DZ';
      if (n.includes('检验试剂')) return 'SJ';
      return '';
    },
    async onStoreroomChange() {
      if (!this.isHsThirdTenant || this.form.id) {
        return;
      }
      // 新增场景：衡水三院编码不可编辑，库房分类变化后由系统重新生成
      this.form.code = await this.generateCode();
      this.$nextTick(() => {
        if (this.$refs.form) {
          this.$refs.form.validateField('storeroomId');
          this.$refs.form.validateField('code');
        }
      });
    },
    /** 处理编码输入 */
    handleCodeInput(value) {
      // 如果用户清空编码，在blur时自动生成
      if (!value || value.trim() === '') {
        this.form.code = '';
      }
    },
    /** 验证编码（blur事件） */
    async validateCode() {
      if (!this.form.code || this.form.code.trim() === '') {
        if (this.isHsThirdTenant && !this.form.storeroomId) {
          return;
        }
        // 如果没有输入编码，自动生成
        this.form.code = await this.generateCode();
        // 触发验证
        this.$nextTick(() => {
          this.$refs.form.validateField('code');
        });
      } else {
        if (this.isHsThirdTenant && this.form.storeroomId) {
          try {
            const wcResp = await getWarehouseCategory(this.form.storeroomId);
            const wc = wcResp && wcResp.data ? wcResp.data : null;
            const prefix = this.resolveHsPrefixByWarehouseName(wc && wc.warehouseCategoryName ? wc.warehouseCategoryName : '');
            if (prefix && !new RegExp("^" + prefix + "\\d{5}$", "i").test(this.form.code.trim())) {
              this.$modal.msgError(`当前库房分类编码规则为：${prefix}+5位数字（如 ${prefix}00001）`);
              return;
            }
          } catch (e) {
            console.error('校验库房分类编码规则失败:', e);
          }
        }
        // 如果有输入，验证唯一性
        this.$refs.form.validateField('code');
      }
    },
    async validateHsHighValueRule() {
      if (!this.isHsThirdTenant || !this.form.financeCategoryId) {
        return true;
      }
      try {
        const res = await getFinanceCategory(this.form.financeCategoryId);
        const fc = res && res.data ? res.data : null;
        const fcName = (fc && fc.financeCategoryName) ? fc.financeCategoryName : '';
        if (fcName.includes('高值耗材') && String(this.form.isGz) !== '1') {
          this.$modal.msgError('财务分类为高值耗材时，必须勾选高值标志');
          return false;
        }
      } catch (e) {
        console.error('校验高值规则失败:', e);
      }
      return true;
    },
    /** 新增按钮操作 */
    async handleAdd() {
      this.reset();
      this.open = true;
      this.dialogMode = 'add';
      this.isDisabled = false;
      this.title = "添加耗材产品";
      this.form.isGz = '2';
      this.form.isBilling = '2';
      this.form.isFollow = '2';
      this.form.isMonitor = '2';
      this.form.isCentralizedProcurement = '2';
      this.form.isSunshineProcurement = '2';
      this.form.isTemporaryPurchase = '2';
      this.form.isServiceFee = '2';
      this.form.isUse = '1'; // 默认为启用
      // 衡水三院按库房分类生成编码：新增时先等待选择库房分类
      this.form.code = this.isHsThirdTenant ? '' : await this.generateCode();
      this.activeTab = 'form'; // 默认显示表单视图
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      this.dialogMode = 'edit';
      this.isDisabled = true; // 修改模式下，耗材编码不可修改
      const id = row.id || this.ids
      getMaterial(id).then(response => {
        this.form = response.data;
        // 确保 isUse 是字符串类型，以便开关组件正常工作
        if (this.form.isUse !== null && this.form.isUse !== undefined) {
          this.form.isUse = String(this.form.isUse);
        } else {
          this.form.isUse = '2'; // 默认为停用
        }
        // 确保 isGz 是字符串类型，以便开关组件正常工作
        if (this.form.isGz !== null && this.form.isGz !== undefined) {
          this.form.isGz = String(this.form.isGz);
        } else {
          this.form.isGz = '2'; // 默认为否
        }
        // 确保 isBilling 是字符串类型，以便开关组件正常工作
        if (this.form.isBilling !== null && this.form.isBilling !== undefined) {
          this.form.isBilling = String(this.form.isBilling);
        } else {
          this.form.isBilling = '2'; // 默认为否
        }
        // 确保 isFollow 是字符串类型，以便开关组件正常工作
        if (this.form.isFollow !== null && this.form.isFollow !== undefined) {
          this.form.isFollow = String(this.form.isFollow);
        } else {
          this.form.isFollow = '2'; // 默认为否
        }
        // 确保 isMonitor 是字符串类型，以便开关组件正常工作
        if (this.form.isMonitor !== null && this.form.isMonitor !== undefined) {
          this.form.isMonitor = String(this.form.isMonitor);
        } else {
          this.form.isMonitor = '2'; // 默认为否
        }
        // 确保 isCentralizedProcurement 是字符串类型，以便开关组件正常工作
        if (this.form.isCentralizedProcurement !== null && this.form.isCentralizedProcurement !== undefined) {
          this.form.isCentralizedProcurement = String(this.form.isCentralizedProcurement);
        } else {
          this.form.isCentralizedProcurement = '2'; // 默认为否
        }
        // 确保 isSunshineProcurement 是字符串类型，以便开关组件正常工作
        if (this.form.isSunshineProcurement !== null && this.form.isSunshineProcurement !== undefined) {
          this.form.isSunshineProcurement = String(this.form.isSunshineProcurement);
        } else {
          this.form.isSunshineProcurement = '2'; // 默认为否
        }
        // 确保 isTemporaryPurchase 是字符串类型，以便开关组件正常工作
        if (this.form.isTemporaryPurchase !== null && this.form.isTemporaryPurchase !== undefined) {
          this.form.isTemporaryPurchase = String(this.form.isTemporaryPurchase);
        } else {
          this.form.isTemporaryPurchase = '2'; // 默认为否
        }
        // 确保 isServiceFee 是字符串类型，以便开关组件正常工作
        if (this.form.isServiceFee !== null && this.form.isServiceFee !== undefined) {
          this.form.isServiceFee = String(this.form.isServiceFee);
        } else {
          this.form.isServiceFee = '2'; // 默认为否
        }
        this.originalIsUse = this.form.isUse;
        this.open = true;
        this.isDisabled = true;
        this.title = "修改耗材产品";
      });
    },
    /** 查看详情（只读） */
    handleView(row) {
      this.reset();
      this.dialogMode = 'view';
      this.isDisabled = true;
      const id = row.id || this.ids;
      getMaterial(id).then(response => {
        this.form = response.data;
        if (this.form.isUse !== null && this.form.isUse !== undefined) this.form.isUse = String(this.form.isUse); else this.form.isUse = '2';
        if (this.form.isGz !== null && this.form.isGz !== undefined) this.form.isGz = String(this.form.isGz); else this.form.isGz = '2';
        if (this.form.isBilling !== null && this.form.isBilling !== undefined) this.form.isBilling = String(this.form.isBilling); else this.form.isBilling = '2';
        if (this.form.isFollow !== null && this.form.isFollow !== undefined) this.form.isFollow = String(this.form.isFollow); else this.form.isFollow = '2';
        if (this.form.isMonitor !== null && this.form.isMonitor !== undefined) this.form.isMonitor = String(this.form.isMonitor); else this.form.isMonitor = '2';
        if (this.form.isCentralizedProcurement !== null && this.form.isCentralizedProcurement !== undefined) this.form.isCentralizedProcurement = String(this.form.isCentralizedProcurement); else this.form.isCentralizedProcurement = '2';
        if (this.form.isSunshineProcurement !== null && this.form.isSunshineProcurement !== undefined) this.form.isSunshineProcurement = String(this.form.isSunshineProcurement); else this.form.isSunshineProcurement = '2';
        if (this.form.isTemporaryPurchase !== null && this.form.isTemporaryPurchase !== undefined) this.form.isTemporaryPurchase = String(this.form.isTemporaryPurchase); else this.form.isTemporaryPurchase = '2';
        if (this.form.isServiceFee !== null && this.form.isServiceFee !== undefined) this.form.isServiceFee = String(this.form.isServiceFee); else this.form.isServiceFee = '2';
        this.originalIsUse = this.form.isUse;
        this.open = true;
        this.title = "查看详情";
        this.activeTab = 'form';
      });
    },
    /** 启用/停用开关变更：编辑模式下需填写原因并调用专用接口 */
    onIsUseChange(newVal) {
      if (!this.form.id) return;
      const isEnable = newVal === '1';
      const actionText = isEnable ? '启用' : '停用';
      this.$prompt('请填写' + actionText + '原因', actionText + '原因', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /\S+/,
        inputErrorMessage: '原因不能为空',
        inputPlaceholder: '请输入' + actionText + '原因'
      }).then(({ value }) => {
        const api = isEnable ? enableMaterial : disableMaterial;
        api(this.form.id, value).then(() => {
          this.$modal.msgSuccess(actionText + '成功');
          this.originalIsUse = this.form.isUse;
          this.getList();
        }).catch(() => {
          this.form.isUse = this.originalIsUse;
        });
      }).catch(() => {
        this.form.isUse = this.originalIsUse;
      });
    },
    /** 弹窗内 Tab 切换：切换到启用停用记录/变更记录时加载数据 */
    onTabClick(tab) {
      if (tab.name === 'statusLog' && this.form.id) {
        getMaterialStatusLog(this.form.id).then(res => {
          this.statusLogList = res.data || [];
        });
      } else if (tab.name === 'changeLog' && this.form.id) {
        getMaterialChangeLog(this.form.id).then(res => {
          this.changeLogList = res.data || [];
        });
        getMaterialTimeline(this.form.id).then(res => {
          this.timelineList = res.data || [];
        });
      }
    },
    /** 提交按钮 */
    submitForm() {
      if (this.form.id != null && this.form.isUse !== this.originalIsUse) {
        const reason = (this.form.statusChangeReason || '').trim();
        if (!reason) {
          this.$modal.msgError(this.form.isUse === '1' ? '请填写启用原因' : '请填写停用原因');
          return;
        }
      }
      this.$refs["form"].validate(valid => {
        if (valid) {
          this.validateHsHighValueRule().then(pass => {
            if (!pass) return;
            if (this.form.id != null) {
              updateMaterial(this.form).then(response => {
                this.$modal.msgSuccess("修改成功");
                this.open = false;
                this.originalIsUse = null;
                this.getList();
              });
            } else {
              addMaterial(this.form).then(response => {
                this.$modal.msgSuccess("新增成功");
                this.open = false;
                this.getList();
              });
            }
          });
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除耗材产品编号为"' + ids + '"的数据项？').then(function() {
        return delMaterial(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    materialIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('foundation/material/export', {
        ...this.queryParams
      }, `material_${new Date().getTime()}.xlsx`)
    },
    /** 更新名称简码 */
    handleUpdateReferred() {
      if (!this.ids || this.ids.length === 0) {
        this.$modal.msgWarning("请先选择要更新简码的产品档案");
        return;
      }
      this.$modal.confirm("是否为选中的产品档案更新名称简码？").then(() => {
        return updateMaterialReferred(this.ids);
      }).then(() => {
        this.$modal.msgSuccess("更新简码成功");
        this.getList();
      }).catch(() => {});
    },
    /** 推送档案按钮操作 */
    handlePushArchive() {
      if (!this.queryParams.supplierId) {
        this.$modal.msgWarning('请先选择供应商');
        return;
      }
      this.$modal.confirm('确定要推送该供应商的档案吗？').then(() => {
        this.loading = true;
        pushMaterialArchive(this.queryParams.supplierId).then(response => {
          this.loading = false;
          if (response.code === 200) {
            this.$modal.msgSuccess('推送档案成功');
            this.getList();
          } else {
            this.$modal.msgError(response.msg || '推送档案失败');
          }
        }).catch(() => {
          this.loading = false;
        });
      }).catch(() => {});
    },
    /** 图片上传前验证 */
    beforeImageUpload(file) {
      const isImage = file.type.indexOf('image/') === 0;
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
    /** 图片上传成功 */
    handleImageSuccess(response, file) {
      if (response.code === 200) {
        this.form.imageUrl = response.url || response.data || response.fileName;
        this.$modal.msgSuccess('图片上传成功');
      } else {
        this.$modal.msgError(response.msg || '图片上传失败');
      }
    },
    /** 预览图片 */
    previewImage() {
      this.imagePreviewUrl = this.form.imageUrl;
      this.imagePreviewVisible = true;
    },
    /** 保存图片 */
    saveImage() {
      // 图片已经通过上传保存到 form.imageUrl 中
      // 当用户点击表单的"确定"按钮时，图片URL会随表单一起提交
      this.$modal.msgSuccess('图片已保存，请点击"确定"按钮提交表单');
    },
    /** 删除图片 */
    removeImage() {
      this.$modal.confirm('确定要删除这张图片吗？').then(() => {
        this.form.imageUrl = null;
        this.$modal.msgSuccess('图片已删除');
      }).catch(() => {});
    },
    /**
     * 单价显示：保留四位小数（前端展示用；后端导出保持原逻辑）
     */
    formatPrice4(value) {
      if (value === null || value === undefined || value === '') {
        return '';
      }
      const n = Number(value);
      if (Number.isNaN(n)) {
        return value;
      }
      return n.toFixed(4);
    }
  }
};
</script>

<style scoped>
.local-modal-mask {
  position: absolute;
  left: 0; top: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.3);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
}

.local-modal-content {
  position: relative;
  z-index: 2001;
}
.local-modal-content {
  background: #fff;
  border-radius: 6px;
  min-width: 600px;
  max-width: 98vw;
  max-height: 98vh;
  overflow: visible;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
}

.local-modal-content.material-modal-content {
  width: calc(100vw - 180px) !important;
  min-width: calc(100vw - 180px) !important;
  min-height: calc(100vh - 80px) !important;
  max-height: calc(100vh - 80px) !important;
  max-width: calc(100vw - 180px) !important;
}

.local-modal-content.material-modal-content > .el-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.local-modal-content.material-modal-content > .el-tabs > .el-tabs__header {
  flex-shrink: 0;
  margin: 0;
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 10;
  padding: 0 20px;
}

.local-modal-content.material-modal-content > .el-tabs > .el-tabs__content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-top: 16px;
  /* 隐藏滚动条但保持滚动功能 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 和 Edge */
}

.local-modal-content.material-modal-content > .el-tabs > .el-tabs__content::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

.local-modal-content.material-modal-content > .el-tabs > .el-tabs__content .el-form {
  padding-top: 8px;
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
  margin: -24px -24px 16px -24px;
  border-radius: 6px 6px 0 0;
  position: relative;
  z-index: 1;
  width: calc(100% + 48px);
  box-sizing: border-box;
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
.app-container > .el-form .el-row {
  margin-bottom: 0px;
}

.app-container > .el-form .el-row:last-child {
  margin-bottom: 0;
}

.app-container > .el-form .el-form-item {
  margin-bottom: 0;
}

/* 减小查询条件表单项的内边距 */
.form-fields-container .el-form-item {
  margin-bottom: 8px !important;
  padding: 0 !important;
}

.form-fields-container .el-form-item__content {
  line-height: 24px !important;
}

/* 搜索框高度降低：输入框、下拉、日期选择器整体与内层统一压低 */
.form-fields-container .el-input,
.form-fields-container .el-select .el-input,
.form-fields-container .el-date-editor {
  height: 24px !important;
}
.form-fields-container .el-input__inner {
  height: 24px !important;
  line-height: 24px !important;
}

.form-fields-container .el-select .el-input__inner {
  height: 24px !important;
  line-height: 24px !important;
}

.form-fields-container .el-date-editor .el-input__inner {
  height: 24px !important;
  line-height: 24px !important;
}

.form-fields-container .el-date-editor .el-input__prefix,
.form-fields-container .el-date-editor .el-input__suffix {
  line-height: 24px !important;
}

.form-fields-container .el-form-item__label {
  padding-bottom: 0 !important;
  line-height: 24px !important;
}

/* 第一行查询条件左对齐紧凑布局 */
.app-container > .el-form .query-row-left .el-col {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
}

.app-container > .el-form .query-row-left .query-item-inline {
  display: inline-block;
  margin-right: 16px;
  margin-bottom: 0;
  vertical-align: top;
}

.app-container > .el-form .query-row-left .query-item-inline:last-child {
  margin-right: 0;
}

/* 统一控制查询条件输入框宽度 */
.app-container > .el-form .query-row-left .query-item-inline .el-input {
  width: 180px;
}

.app-container > .el-form .query-row-left .query-item-inline .query-select-wrapper,
.app-container > .el-form .query-row-first .query-item-inline .query-select-wrapper {
  width: 180px;
  display: inline-block;
}

.app-container > .el-form .query-row-second .query-item-inline .query-select-wrapper {
  width: 180px;
  display: inline-block;
}

.app-container > .el-form .query-row-left .query-item-inline .query-select-wrapper.query-select-wrapper-small,
.app-container > .el-form .query-row-first .query-item-inline .query-select-wrapper.query-select-wrapper-small {
  width: 150px !important;
  max-width: 150px !important;
}

.app-container > .el-form .query-row-second .query-item-inline .query-select-wrapper.query-select-wrapper-small {
  width: 100px !important;
  max-width: 100px !important;
}

.app-container > .el-form .query-row-left .query-item-inline .query-select-wrapper > *,
.app-container > .el-form .query-row-first .query-item-inline .query-select-wrapper > *,
.app-container > .el-form .query-row-second .query-item-inline .query-select-wrapper > *,
.app-container > .el-form .query-row-third .query-item-inline .query-select-wrapper > * {
  width: 100%;
}

.app-container > .el-form .query-row-first .query-item-inline .query-select-wrapper.query-select-wrapper-small > *,
.app-container > .el-form .query-row-second .query-item-inline .query-select-wrapper.query-select-wrapper-small > *,
.app-container > .el-form .query-row-third .query-item-inline .query-select-wrapper.query-select-wrapper-small > * {
  width: 100% !important;
}

.app-container > .el-form .query-row-left .query-item-inline .el-select {
  width: 150px;
}

.app-container > .el-form .query-row-first .query-item-inline .query-select-wrapper.query-select-wrapper-small .el-select,
.app-container > .el-form .query-row-first .query-item-inline .query-select-wrapper-small .el-select {
  width: 150px !important;
}

.app-container > .el-form .query-row-second .query-item-inline .query-select-wrapper.query-select-wrapper-small,
.app-container > .el-form .query-row-third .query-item-inline .query-select-wrapper.query-select-wrapper-small {
  width: 100px !important;
  max-width: 100px !important;
  min-width: 100px !important;
}

.app-container > .el-form .query-row-second .query-item-inline .query-select-wrapper.query-select-wrapper-small .el-select,
.app-container > .el-form .query-row-second .query-item-inline .query-select-wrapper-small .el-select,
.app-container > .el-form .query-row-second .query-item-inline .query-select-wrapper.query-select-wrapper-small > .el-select,
.app-container > .el-form .query-row-second .query-item-inline .query-select-wrapper-small > .el-select,
.app-container > .el-form .query-row-third .query-item-inline .query-select-wrapper.query-select-wrapper-small .el-select,
.app-container > .el-form .query-row-third .query-item-inline .query-select-wrapper-small .el-select,
.app-container > .el-form .query-row-third .query-item-inline .query-select-wrapper.query-select-wrapper-small > .el-select,
.app-container > .el-form .query-row-third .query-item-inline .query-select-wrapper-small > .el-select {
  width: 100% !important;
  max-width: 100% !important;
}

.app-container > .el-form .query-row-second .query-item-inline .query-select-wrapper.query-select-wrapper-small .el-input__inner,
.app-container > .el-form .query-row-second .query-item-inline .query-select-wrapper-small .el-input__inner,
.app-container > .el-form .query-row-third .query-item-inline .query-select-wrapper.query-select-wrapper-small .el-input__inner,
.app-container > .el-form .query-row-third .query-item-inline .query-select-wrapper-small .el-input__inner {
  width: 100% !important;
  max-width: 100% !important;
}

/* 第二行日期范围布局 */
.app-container > .el-form .query-row-second {
  position: relative;
}

/* 第三行字段间距调整 - 状态、高值、跟台更紧凑 */
.app-container > .el-form .query-row-third .query-item-inline {
  margin-right: 8px !important;
  display: inline-block;
  vertical-align: top;
}

.app-container > .el-form .query-row-third .query-item-inline:last-child {
  margin-right: 0 !important;
}

/* 确保日期和注册证号在同一行 */
.app-container > .el-form .query-row-third .el-form-item {
  white-space: nowrap;
  display: inline-block !important;
  vertical-align: top;
  margin-right: 8px !important;
  margin-bottom: 0 !important;
}

.app-container > .el-form .query-row-third .el-form-item .el-form-item__content {
  display: inline-flex !important;
  align-items: center;
  flex-wrap: nowrap;
}

/* 日期字段特殊样式 */
.app-container > .el-form .query-row-third .query-item-date {
  display: inline-block !important;
}

.app-container > .el-form .query-row-third .query-item-date .el-form-item__content {
  display: inline-flex !important;
  align-items: center;
  white-space: nowrap;
}

/* 高值和跟台字段更紧凑 */
.app-container > .el-form .query-row-third .query-item-compact,
.app-container > .el-form .query-row-fourth .query-item-compact {
  margin-right: 4px !important;
}

.app-container > .el-form .query-row-third .query-item-compact + .query-item-compact,
.app-container > .el-form .query-row-fourth .query-item-compact + .query-item-compact {
  margin-left: 0 !important;
}

/* 第四行字段样式 */
.app-container > .el-form .query-row-fourth .query-item-inline {
  margin-right: 8px !important;
  display: inline-block;
  vertical-align: top;
}

.app-container > .el-form .query-row-fourth .query-item-inline:last-child {
  margin-right: 0 !important;
}

/* 确保日期的两个日期选择器在同一行 */
.app-container > .el-form .query-row-second .el-form-item {
  white-space: nowrap;
}

.app-container > .el-form .query-row-second .el-form-item .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

/* 页面左右仅留 8px，使顶部搜索容器更宽；底部少留白 */
.material-page-container.app-container {
  position: relative;
  min-height: calc(100vh - 84px);
  padding-left: 8px !important;
  padding-right: 8px !important;
  padding-bottom: 8px !important;
}

/* 翻页上移、底部不留白 */
.material-page-container .pagination-container {
  margin-top: 4px !important;
  margin-bottom: 0 !important;
}

/* 查询容器样式 */
.query-container {
  margin-top: -15px;
  margin-bottom: 16px;
}

/* 查询条件容器框样式：左右内边距 8px，容器更宽 */
.form-fields-container {
  background: #F5F7FA;
  padding: 12px 8px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
  border: 1px solid #DCDFE6;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

/* 图片容器样式 */
.material-image-container {
  cursor: pointer;
  position: relative;
}

.material-image-preview {
  width: 120px;
  height: 120px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  background-color: #f5f7fa;
}

.material-image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.material-image-preview .image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  opacity: 0;
  transition: opacity 0.3s;
}

.material-image-preview:hover .image-overlay {
  opacity: 1;
}

.material-image-preview .image-overlay i {
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  padding: 5px;
}

.material-image-preview .image-overlay i:hover {
  color: #409eff;
}

.material-image-placeholder {
  width: 120px;
  height: 120px;
  border: 2px dashed #dcdfe6;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #fafafa;
  cursor: pointer;
  transition: border-color 0.3s;
}

.material-image-placeholder:hover {
  border-color: #409eff;
}

.material-image-placeholder i {
  font-size: 28px;
  color: #8c939d;
}

/* 图片视图内容区域 */
.image-tab-content {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

/* 大尺寸图片预览 */
.material-image-preview-large {
  width: 300px;
  height: 300px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  background-color: #f5f7fa;
  cursor: pointer;
}

.material-image-preview-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
}

.material-image-preview-large .image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  opacity: 0;
  transition: opacity 0.3s;
}

.material-image-preview-large:hover .image-overlay {
  opacity: 1;
}

.material-image-preview-large .image-overlay i {
  color: #fff;
  font-size: 28px;
  cursor: pointer;
  padding: 10px;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 50%;
}

.material-image-preview-large .image-overlay i:hover {
  color: #409eff;
  background-color: rgba(64, 158, 255, 0.5);
}

/* 大尺寸占位符 */
.material-image-placeholder-large {
  width: 300px;
  height: 300px;
  border: 2px dashed #dcdfe6;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #fafafa;
  cursor: pointer;
  transition: border-color 0.3s;
}

.material-image-placeholder-large:hover {
  border-color: #409eff;
}

.material-image-placeholder-large i {
  font-size: 48px;
  color: #8c939d;
}
</style>

<style>
/* 非scoped样式，确保弹窗宽度生效 */
.material-cell-top-left {
  white-space: normal;
  word-break: break-word;
  overflow-wrap: anywhere;
  text-align: left;
  vertical-align: top;
  line-height: 1.4;
}

.material-cell-price-right {
  white-space: normal;
  word-break: break-word;
  overflow-wrap: anywhere;
  text-align: right;
  vertical-align: top;
  line-height: 1.4;
}

.material-top-cell {
  vertical-align: top !important;
}

.material-price-cell {
  vertical-align: top !important;
}

.local-modal-content.material-modal-content {
  width: calc(100vw - 180px) !important;
  min-width: calc(100vw - 180px) !important;
  min-height: calc(100vh - 80px) !important;
  max-height: calc(100vh - 80px) !important;
  max-width: calc(100vw - 180px) !important;
}

/* 标签页固定头部样式 */
.local-modal-content.material-modal-content > .el-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.local-modal-content.material-modal-content > .el-tabs > .el-tabs__header {
  flex-shrink: 0;
  margin: 0;
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 10;
  padding: 0 20px;
}

.local-modal-content.material-modal-content > .el-tabs > .el-tabs__content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-top: 16px;
  /* 隐藏滚动条但保持滚动功能 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 和 Edge */
}

.local-modal-content.material-modal-content > .el-tabs > .el-tabs__content::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

.local-modal-content.material-modal-content > .el-tabs > .el-tabs__content .el-form {
  padding-top: 8px;
}

/* 开关控件容器样式 */
.switch-container {
  background: #fafafa;
  padding: 12px 20px 12px 12px;
  border-radius: 4px;
  border: 1px solid #EBEEF5;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.switch-container .switch-form-item {
  margin-bottom: 0;
  margin-right: 0;
}

.switch-container .switch-column {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.switch-container .switch-row {
  display: flex;
  flex-direction: row;
  gap: 20px;
  align-items: center;
}

/* HIS对照框样式 */
.his-compare-container {
  background: #fafafa;
  border-radius: 4px;
  border: 1px solid #EBEEF5;
  margin-top: 16px;
}

.his-compare-header {
  padding: 12px 20px;
  border-bottom: 1px solid #EBEEF5;
  background: #f5f7fa;
}

.his-compare-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.his-compare-content {
  padding: 16px 20px;
}

/* HRP对照框样式 */
.hrp-compare-container {
  background: #fafafa;
  border-radius: 4px;
  border: 1px solid #EBEEF5;
  margin-top: 16px;
}

.hrp-compare-header {
  padding: 12px 20px;
  border-bottom: 1px solid #EBEEF5;
  background: #f5f7fa;
}

.hrp-compare-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.hrp-compare-content {
  padding: 16px 20px;
}

/* 阳光平台信息框样式 */
.sunshine-platform-container {
  background: #fafafa;
  border-radius: 4px;
  border: 1px solid #EBEEF5;
  margin-top: 16px;
}

.sunshine-platform-header {
  padding: 12px 20px;
  border-bottom: 1px solid #EBEEF5;
  background: #f5f7fa;
}

.sunshine-platform-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.sunshine-platform-content {
  padding: 16px 20px;
}

/* 使用状态开关样式：启用文字在左边 */
.switch-with-label-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.switch-with-label-left .switch-label {
  font-size: 14px;
  color: #909399;
  min-width: 40px;
  white-space: nowrap;
}

.switch-with-label-left .switch-label.active {
  color: #409eff;
  font-weight: 500;
}

/* 表格滚动条样式 - 加粗滚动条 */
/* 确保固定列正常显示 */
.el-table__fixed-right {
  z-index: 12 !important;
}

.el-table__fixed-right .el-table__body-wrapper {
  z-index: 12 !important;
}

.el-table__body-wrapper::-webkit-scrollbar,
.el-table__fixed-body-wrapper::-webkit-scrollbar,
.el-table__fixed-right::-webkit-scrollbar,
.el-table__fixed::-webkit-scrollbar {
  width: 3px !important;
  height: 6px !important;
  transition: width 0.2s ease, height 0.2s ease;
}

.el-table__body-wrapper:hover::-webkit-scrollbar,
.el-table__fixed-body-wrapper:hover::-webkit-scrollbar,
.el-table__fixed-right:hover::-webkit-scrollbar,
.el-table__fixed:hover::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

.el-table__body-wrapper::-webkit-scrollbar:vertical,
.el-table__fixed-body-wrapper::-webkit-scrollbar:vertical,
.el-table__fixed-right::-webkit-scrollbar:vertical,
.el-table__fixed::-webkit-scrollbar:vertical {
  width: 3px !important;
  transition: width 0.2s ease;
}

.el-table__body-wrapper:hover::-webkit-scrollbar:vertical,
.el-table__fixed-body-wrapper:hover::-webkit-scrollbar:vertical,
.el-table__fixed-right:hover::-webkit-scrollbar:vertical,
.el-table__fixed:hover::-webkit-scrollbar:vertical {
  width: 8px !important;
}

.el-table__body-wrapper::-webkit-scrollbar:horizontal,
.el-table__fixed-body-wrapper::-webkit-scrollbar:horizontal,
.el-table__fixed-right::-webkit-scrollbar:horizontal,
.el-table__fixed::-webkit-scrollbar:horizontal {
  height: 6px !important;
  transition: height 0.2s ease;
}

.el-table__body-wrapper:hover::-webkit-scrollbar:horizontal,
.el-table__fixed-body-wrapper:hover::-webkit-scrollbar:horizontal,
.el-table__fixed-right:hover::-webkit-scrollbar:horizontal,
.el-table__fixed:hover::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

.el-table__body-wrapper::-webkit-scrollbar-track,
.el-table__fixed-body-wrapper::-webkit-scrollbar-track,
.el-table__fixed-right::-webkit-scrollbar-track,
.el-table__fixed::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

.el-table__body-wrapper::-webkit-scrollbar-thumb,
.el-table__fixed-body-wrapper::-webkit-scrollbar-thumb,
.el-table__fixed-right::-webkit-scrollbar-thumb,
.el-table__fixed::-webkit-scrollbar-thumb {
  background: #c1c1c1 !important;
  border-radius: 3px !important;
  min-width: 2px !important;
  min-height: 4px !important;
  /* 通过background-clip和padding来减小滚动条滑块视觉长度 */
  background-clip: padding-box;
  border: 2px solid transparent;
  transition: background 0.3s ease;
}

.el-table__body-wrapper:hover::-webkit-scrollbar-thumb,
.el-table__fixed-body-wrapper:hover::-webkit-scrollbar-thumb,
.el-table__fixed-right:hover::-webkit-scrollbar-thumb,
.el-table__fixed:hover::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
}

.el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
.el-table__fixed-body-wrapper::-webkit-scrollbar-thumb:hover,
.el-table__fixed-right::-webkit-scrollbar-thumb:hover,
.el-table__fixed::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8 !important;
}

/* 针对Element UI表格的滚动条组件 */
.el-table .el-scrollbar__bar.is-vertical,
.el-table__fixed .el-scrollbar__bar.is-vertical,
.el-table__fixed-right .el-scrollbar__bar.is-vertical {
  width: 6px !important;
}

.el-table .el-scrollbar__bar.is-horizontal,
.el-table__fixed .el-scrollbar__bar.is-horizontal,
.el-table__fixed-right .el-scrollbar__bar.is-horizontal {
  height: 12px !important;
}

.el-table .el-scrollbar__thumb,
.el-table__fixed .el-scrollbar__thumb,
.el-table__fixed-right .el-scrollbar__thumb {
  min-width: 2px !important;
  min-height: 4px !important;
  /* 通过设置固定尺寸来减小滚动条滑块长度 */
  width: 2px !important;
  height: 4px !important;
  max-width: 2px !important;
  max-height: 4px !important;
}

/* 确保滚动条在固定列上方显示 */
.el-table__body-wrapper .el-scrollbar__bar {
  z-index: 13 !important;
  position: relative;
}

.el-table__fixed-right .el-scrollbar__bar {
  z-index: 13 !important;
  position: relative;
}

/* 表格线条淡色（参考耗材对照明细框）：使用 #EBEEF5 细线 */
.material-page-container .el-table {
  border: 1px solid #EBEEF5 !important;
}

.material-page-container .el-table th {
  border-right: 1px solid #EBEEF5 !important;
  border-bottom: 1px solid #EBEEF5 !important;
}

.material-page-container .el-table th:first-child {
  border-left: 1px solid #EBEEF5 !important;
}

.material-page-container .el-table td {
  border-right: 1px solid #EBEEF5 !important;
  border-bottom: 1px solid #EBEEF5 !important;
  padding: 8px 0 !important;
}

.material-page-container .el-table td:first-child {
  border-left: 1px solid #EBEEF5 !important;
}

.material-page-container .el-table::before {
  height: 1px !important;
  background-color: #EBEEF5 !important;
}

.material-page-container .el-table::after {
  width: 1px !important;
  background-color: #EBEEF5 !important;
}

/* 表格标题行字体加粗加大 - 仅针对当前页面 */
.material-page-container .el-table th {
  font-size: 15px !important;
  font-weight: 600 !important;
}

.material-page-container .el-table th .cell {
  font-size: 15px !important;
  font-weight: 600 !important;
}

/* 启用停用记录、变更记录 Tab 内容 */
.log-tab-content {
  padding: 12px 0;
  min-height: 200px;
}
.empty-log-tip {
  text-align: center;
  color: #909399;
  padding: 24px 0;
  font-size: 14px;
}
.status-reason-form-item {
  margin-left: 10px;
}

/* 变更记录 Tab：左侧时间轴 + 右侧变更明细 */
.change-log-with-timeline .el-row { margin: 0; }
.timeline-panel,
.change-log-panel {
  padding: 12px;
  background: #fafafa;
  border-radius: 4px;
  min-height: 320px;
}
.timeline-title {
  font-weight: 600;
  margin-bottom: 12px;
  font-size: 14px;
  color: #303133;
}
.timeline-item-title { font-weight: 500; color: #303133; margin-bottom: 4px; }
.timeline-item-meta { font-size: 12px; color: #909399; margin-bottom: 2px; }
.timeline-item-desc { font-size: 12px; color: #606266; line-height: 1.4; word-break: break-all; }
.el-timeline { padding-left: 8px; }
</style>

