<template>
  <div class="app-container material-page-container">
    <div class="query-container">
      <div class="form-fields-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">

      <el-row class="query-row-first">
        <el-col :span="24">
          <el-form-item label="供应商" prop="supplierId" class="query-item-inline">
                <div class="query-select-wrapper query-select-wrapper-small" style="width: 150px;">
              <SelectSupplier v-model="queryParams.supplierId"/>
            </div>
          </el-form-item>

          <el-form-item label="耗材名称" prop="name" class="query-item-inline">
            <el-input
              v-model="queryParams.name"
                  placeholder="支持名称/编码/首字母搜索"
              clearable
              @keyup.enter.native="handleQuery"
                  style="width: 150px"
            />
          </el-form-item>

          <el-form-item label="UDI码" prop="udiNo" class="query-item-inline">
            <el-input
              v-model="queryParams.udiNo"
              placeholder="请输入UDI码（支持模糊查询）"
              clearable
              @keyup.enter.native="handleQuery"
                  style="width: 150px"
            />
          </el-form-item>

          <el-form-item label="注册证号" prop="registerNo" class="query-item-inline">
            <el-input
              v-model="queryParams.registerNo"
              placeholder="请输入注册证号"
              clearable
              @keyup.enter.native="handleQuery"
              style="width: 150px"
            />
          </el-form-item>

          <el-form-item label="阳采编码" prop="sunshineCode" class="query-item-inline">
            <el-input
              v-model="queryParams.sunshineCode"
              placeholder="请输入阳采编码"
              clearable
              @keyup.enter.native="handleQuery"
              style="width: 150px"
            />
          </el-form-item>

          <el-form-item label="生产厂家" prop="factoryId" class="query-item-inline">
            <div class="query-select-wrapper query-select-wrapper-small" style="width: 150px;">
              <SelectFactory v-model="queryParams.factoryId"/>
            </div>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row class="query-row-third">
        <el-col :span="24">
              <el-form-item label="日期" class="query-item-inline query-item-date">
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

              <el-form-item label="库房分类" prop="storeroomId" class="query-item-inline">
                <div class="query-select-wrapper query-select-wrapper-small" style="width: 100px !important;">
                  <SelectWarehouseCategory v-model="queryParams.storeroomId" style="width: 100%"/>
                </div>
              </el-form-item>

              <el-form-item label="财务分类" prop="financeCategoryId" class="query-item-inline">
                <div class="query-select-wrapper query-select-wrapper-small" style="width: 100px !important;">
                  <SelectFinanceCategory v-model="queryParams.financeCategoryId" style="width: 100%"/>
                </div>
              </el-form-item>

              <el-form-item label="货位" prop="locationId" class="query-item-inline">
                <div class="query-select-wrapper query-select-wrapper-small" style="width: 150px;">
                  <SelectLocation v-model="queryParams.locationId"/>
                </div>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row class="query-row-fourth">
            <el-col :span="24">
          <el-form-item label="状态" prop="isUse" class="query-item-inline">
            <el-select v-model="queryParams.isUse" placeholder="请选择" style="width: 100px">
              <el-option
                v-for="dict in dict.type.is_use_status"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              ></el-option>
            </el-select>
          </el-form-item>

              <el-form-item label="高值" prop="isGz" class="query-item-inline query-item-compact">
            <el-select v-model="queryParams.isGz" placeholder="请选择" style="width: 100px">
              <el-option
                v-for="dict in dict.type.is_yes_no"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              ></el-option>
            </el-select>
          </el-form-item>

              <el-form-item label="跟台" prop="isFollow" class="query-item-inline query-item-compact">
            <el-select v-model="queryParams.isFollow" placeholder="请选择" style="width: 100px">
              <el-option
                v-for="dict in dict.type.is_yes_no"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              ></el-option>
            </el-select>
          </el-form-item>

              <el-form-item label="计费" prop="isBilling" class="query-item-inline query-item-compact">
                <el-select v-model="queryParams.isBilling" placeholder="请选择" style="width: 100px">
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
          type="primary"
          plain
          icon="el-icon-plus"
          size="medium"
          @click="handleAdd"
          v-hasPermi="['foundation:material:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-edit"
          size="medium"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['foundation:material:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="medium"
          :disabled="single"
          @click="handleDelete"
          v-hasPermi="['foundation:material:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="medium"
          @click="handleExport"
          v-hasPermi="['foundation:material:export']"
        >导出</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="info"
          icon="el-icon-upload2"
          size="medium"
          @click="handleImport"
          v-hasPermi="['foundation:material:import']"
        >导入</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          icon="el-icon-upload"
          size="medium"
          :disabled="!queryParams.supplierId"
          @click="handlePushArchive"
          v-hasPermi="['foundation:material:push']"
        >推送档案</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          icon="el-icon-search"
          size="medium"
          @click="handleQuery"
        >搜索</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList" :columns="columns"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="materialList" :row-class-name="materialIndex" @selection-change="handleSelectionChange" height="60vh" border>
      <el-table-column type="selection" width="55" align="center" fixed="left" />
      <el-table-column type="index" label="序号" align="center" width="80" key="index" v-if="columns[0].visible" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column label="耗材编码" align="center" prop="code" width="100" key="code" v-if="columns[1].visible" show-overflow-tooltip resizable/>
      <el-table-column label="耗材名称" align="center" prop="name" width="180" key="name" v-if="columns[2].visible" show-overflow-tooltip resizable/>
      <el-table-column label="规格" align="center" prop="speci" width="120" key="speci" v-if="columns[3].visible" show-overflow-tooltip resizable/>
      <el-table-column label="型号" align="center" prop="model" width="120" key="model" v-if="columns[4].visible" show-overflow-tooltip resizable/>
      <el-table-column label="价格" align="center" prop="price" width="100" key="price" v-if="columns[5].visible" show-overflow-tooltip resizable/>
      <el-table-column label="单位" align="center" prop="fdUnit.unitName" width="80" key="unit" v-if="columns[6].visible" show-overflow-tooltip resizable/>
      <el-table-column label="生产厂家" align="center" prop="fdFactory.factoryName" width="150" key="factory" v-if="columns[7].visible" show-overflow-tooltip resizable/>
      <el-table-column label="供应商" align="center" prop="supplier.name" width="180" key="supplier" v-if="columns[8].visible" show-overflow-tooltip resizable/>
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
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="120" fixed="right">
        <template slot-scope="scope">
          <el-button
            size="small"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['foundation:material:edit']"
          >修改</el-button>
          <el-button
            size="small"
            type="text"
            icon="el-icon-delete"
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
      @pagination="getList"
    />

    <!-- 添加或修改耗材产品局部弹窗 -->
    <div v-if="open" class="local-modal-mask">
      <div class="local-modal-content material-modal-content">
        <div class="modal-header">
          <div class="modal-title">{{ title }}</div>
          <el-button size="medium" @click="cancel" class="close-btn">关闭</el-button>
          </div>
        <el-tabs v-model="activeTab">
          <!-- 基本信息 -->
          <el-tab-pane label="基本信息" name="form">
            <el-form ref="form" :model="form" :rules="rules" label-width="120px">
              <!-- 第一行 -->
          <el-row :gutter="20">
                <el-col :span="4">
                  <el-form-item label="耗材编码：" prop="code">
                <el-input 
                  v-model="form.code" 
                  :disabled="isDisabled || form.id != null" 
                  placeholder="请输入耗材编码（留空自动生成6位数字，手工输入可为任意长度）" 
                  @blur="validateCode"
                  @input="handleCodeInput"
                />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="耗材名称：" prop="name">
                <el-input v-model="form.name" @input="nameChange" placeholder="请输入耗材名称" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="名称简码：" prop="referredName">
                <el-input v-model="form.referredName" :disabled="true" placeholder="请输入名称简码" />
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
                    <el-input v-model="form.speci" placeholder="请输入规格" />
              </el-form-item>
            </el-col>
          </el-row>

              <!-- 第二行 -->
          <el-row :gutter="20">
                <el-col :span="4">
                  <el-form-item label="型号：" prop="model">
                    <el-input v-model="form.model" placeholder="请输入型号" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="单位：" prop="unitId">
                <SelectUnit v-model="form.unitId" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="价格：" prop="price">
                    <el-input v-model="form.price" placeholder="请输入价格" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="库房分类：" prop="storeroomId">
                    <SelectWarehouseCategory v-model="form.storeroomId"/>
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="财务分类：" prop="financeCategoryId">
                    <SelectFinanceCategory v-model="form.financeCategoryId"/>
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="产地：" prop="producer">
                    <el-input v-model="form.producer" placeholder="请输入产地" />
              </el-form-item>
            </el-col>
          </el-row>

              <!-- 第三行 -->
          <el-row :gutter="20">
                <el-col :span="4">
                  <el-form-item label="通用名称：" prop="useName">
                    <el-input v-model="form.useName" placeholder="请输入通用名称" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="注册证名称：" prop="registerName">
                    <el-input v-model="form.registerName" placeholder="请输入注册证名称" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="注册证件号：" prop="registerNo">
                    <el-input v-model="form.registerNo" placeholder="请输入注册证件号" />
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
                <el-input v-model="form.medicalNo" placeholder="请输入医保编码" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="医保名称：" prop="medicalName">
                    <el-input v-model="form.medicalName" placeholder="请输入医保名称" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="销售价：" prop="salePrice">
                    <el-input v-model="form.salePrice" placeholder="请输入销售价" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="中标价格：" prop="successfulPrice">
                    <el-input v-model="form.successfulPrice" placeholder="请输入中标价格" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="中标号：" prop="successfulNo">
                    <el-input v-model="form.successfulNo" placeholder="请输入中标号" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="招标类别：" prop="successfulType">
                    <el-input v-model="form.successfulType" placeholder="请输入招标类别" />
              </el-form-item>
            </el-col>
          </el-row>

              <!-- 第五行 -->
          <el-row :gutter="20">
                <el-col :span="4">
                  <el-form-item label="包装规格：" prop="packageSpeci">
                    <el-input v-model="form.packageSpeci" placeholder="请输入包装规格" />
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
                    <el-input v-model="form.brand" placeholder="请输入品牌" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="用途：" prop="useto">
                    <el-input v-model="form.useto" placeholder="请输入用途" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="材质：" prop="quality">
                    <el-input v-model="form.quality" placeholder="请输入材质" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="功能：" prop="function">
                    <el-input v-model="form.function" placeholder="请输入功能" />
                  </el-form-item>
                </el-col>
          </el-row>

              <!-- 第六行 -->
          <el-row :gutter="20">
                <el-col :span="4">
                  <el-form-item label="UDI码：" prop="udiNo">
                <el-input v-model="form.udiNo" placeholder="请输入UDI码" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="阳光平台编码：" prop="sunshineCode">
                <el-input v-model="form.sunshineCode" placeholder="请输入阳光平台编码" />
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
                    <el-input v-model="form.countryNo" placeholder="请输入贯标码" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="许可证编号：" prop="permitNo">
                    <el-input v-model="form.permitNo" placeholder="请输入许可证编号" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="商品说明：" prop="description">
                    <el-input v-model="form.description" placeholder="请输入商品说明" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="备注：" prop="countryName">
                <el-input v-model="form.countryName" placeholder="请输入备注" />
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
                      ></el-switch>
                    </div>
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
                        <el-input v-model="form.hisChargeCode" placeholder="请输入收费编码" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                      <el-form-item label="收费规格：" prop="hisChargeSpeci">
                        <el-input v-model="form.hisChargeSpeci" placeholder="请输入收费规格" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="4">
                      <el-form-item label="收费型号：" prop="hisChargeModel">
                        <el-input v-model="form.hisChargeModel" placeholder="请输入收费型号" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="4">
                      <el-form-item label="收费单价：" prop="hisChargePrice">
                        <el-input v-model="form.hisChargePrice" placeholder="请输入收费单价" />
              </el-form-item>
                    </el-col>
                  </el-row>
                  <el-row :gutter="20">
                    <el-col :span="4">
                      <el-form-item label="收费名称：" prop="hisChargeName">
                        <el-input v-model="form.hisChargeName" placeholder="请输入收费名称" />
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
                        <el-input v-model="form.sunshinePlatformId" placeholder="请输入平台id" />
                  </el-form-item>
                </el-col>
                  </el-row>
                  <el-row :gutter="20">
                <el-col :span="4">
                      <el-form-item label="名称：" prop="sunshineName">
                        <el-input v-model="form.sunshineName" placeholder="请输入名称" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                      <el-form-item label="配送协议编号：" prop="sunshineDeliveryAgreementNo">
                        <el-input v-model="form.sunshineDeliveryAgreementNo" placeholder="请输入配送协议编号" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                      <el-form-item label="配送企业编号：" prop="sunshineDeliveryEnterpriseNo">
                        <el-input v-model="form.sunshineDeliveryEnterpriseNo" placeholder="请输入配送企业编号" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                      <el-form-item label="配送企业：" prop="sunshineDeliveryEnterprise">
                        <el-input v-model="form.sunshineDeliveryEnterprise" placeholder="请输入配送企业" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                      <el-form-item label="包装规格：" prop="sunshinePackagingSpec">
                        <el-input v-model="form.sunshinePackagingSpec" placeholder="请输入包装规格" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="4">
                      <el-form-item label="规格：" prop="sunshineSpec">
                        <el-input v-model="form.sunshineSpec" placeholder="请输入规格" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
                <el-col :span="4">
                      <el-form-item label="单位：" prop="sunshineUnit">
                        <el-input v-model="form.sunshineUnit" placeholder="请输入单位" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                      <el-form-item label="型号：" prop="sunshineModel">
                        <el-input v-model="form.sunshineModel" placeholder="请输入型号" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                      <el-form-item label="单价：" prop="sunshinePrice">
                        <el-input v-model="form.sunshinePrice" placeholder="请输入单价" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                      <el-form-item label="厂家编号：" prop="sunshineFactoryNo">
                        <el-input v-model="form.sunshineFactoryNo" placeholder="请输入厂家编号" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                      <el-form-item label="厂家：" prop="sunshineFactory">
                        <el-input v-model="form.sunshineFactory" placeholder="请输入厂家" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                      <el-form-item label="耗材分类代码：" prop="sunshineCategoryCode">
                        <el-input v-model="form.sunshineCategoryCode" placeholder="请输入耗材分类代码" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
                <el-col :span="4">
                      <el-form-item label="交易产品代码：" prop="sunshineProductCode">
                        <el-input v-model="form.sunshineProductCode" placeholder="请输入交易产品代码" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                      <el-form-item label="采购类别：" prop="sunshinePurchaseCategory">
                        <el-input v-model="form.sunshinePurchaseCategory" placeholder="请输入采购类别" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                      <el-form-item label="一级目录：" prop="sunshineFirstLevel">
                        <el-input v-model="form.sunshineFirstLevel" placeholder="请输入一级目录" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                      <el-form-item label="二级目录：" prop="sunshineSecondLevel">
                        <el-input v-model="form.sunshineSecondLevel" placeholder="请输入二级目录" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                      <el-form-item label="三级目录：" prop="sunshineThirdLevel">
                        <el-input v-model="form.sunshineThirdLevel" placeholder="请输入三级目录" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                      <el-form-item label="来源：" prop="sunshineSource">
                        <el-input v-model="form.sunshineSource" placeholder="请输入来源" />
              </el-form-item>
            </el-col>
                  </el-row>
                  <el-row :gutter="20">
                    <el-col :span="4">
                      <el-form-item label="系数：" prop="sunshineCoefficient">
                        <el-input v-model="form.sunshineCoefficient" placeholder="请输入系数" />
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
                        <el-input v-model="form.hrpCode" placeholder="请输入HRP编码" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="4">
                      <el-form-item label="HRP规格：" prop="hrpSpeci">
                        <el-input v-model="form.hrpSpeci" placeholder="请输入HRP规格" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="4">
                      <el-form-item label="HRP序号：" prop="hrpSeq">
                        <el-input v-model="form.hrpSeq" placeholder="请输入HRP序号" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="4">
                      <el-form-item label="HRP单位：" prop="hrpUnit">
                        <el-input v-model="form.hrpUnit" placeholder="请输入HRP单位" />
                      </el-form-item>
                    </el-col>
                  </el-row>
                  <el-row :gutter="20">
                    <el-col :span="4">
                      <el-form-item label="HRP单价：" prop="hrpPrice">
                        <el-input v-model="form.hrpPrice" placeholder="请输入HRP单价" />
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
              <div v-if="form.imageUrl" style="margin-top: 20px;">
                <el-button type="primary" icon="el-icon-view" @click="previewImage">查看图片</el-button>
                <el-button type="success" icon="el-icon-check" @click="saveImage">保存</el-button>
                <el-button type="danger" icon="el-icon-delete" @click="removeImage">删除图片</el-button>
              </div>
            </div>
          </div>
          </el-tab-pane>
        </el-tabs>
        
        <div class="dialog-footer" style="text-align:center;margin-top:16px;">
          <el-button type="primary" size="medium" @click="submitForm">确 定</el-button>
          <el-button size="medium" @click="cancel">取 消</el-button>
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

    <!-- 耗材导入对话框 -->
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
        :on-change="handleFileChange"
        :auto-upload="false"
        drag
      >
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        <div class="el-upload__tip text-center" slot="tip">
          <div class="el-upload__tip" slot="tip">
            <el-checkbox v-model="upload.updateSupport" /> 是否更新已经存在的耗材数据
          </div>
          <span>仅允许导入xls、xlsx格式文件。</span>
          <el-link type="primary" :underline="false" style="font-size:12px;vertical-align: baseline;" @click="importTemplate">下载模板</el-link>
        </div>
      </el-upload>
        <div v-if="parseResult.show" style="margin-top:16px;padding:12px;background-color:#f5f7fa;border-radius:4px;max-height:200px;overflow-y:auto;">
          <div v-if="parseResult.success" style="color:#67c23a;">
            <i class="el-icon-success"></i> {{ parseResult.message }}
          </div>
          <div v-else style="color:#f56c6c;">
            <i class="el-icon-error"></i> {{ parseResult.message }}
            <div v-if="parseResult.errors && parseResult.errors.length > 0" style="margin-top:8px;font-size:12px;">
              <div v-for="(error, index) in parseResult.errors" :key="index" style="margin-top:4px;">
                {{ error }}
              </div>
            </div>
          </div>
        </div>
        <div class="dialog-footer" style="text-align:right;margin-top:16px;">
        <el-button type="warning" @click="parseExcelFile" :disabled="!uploadFile || upload.isUploading">解 析</el-button>
        <el-button type="primary" @click="submitFileForm" :disabled="upload.isUploading">确 定</el-button>
        <el-button @click="upload.open = false">取 消</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { listMaterial, listMaterialAll, getMaterial, delMaterial, addMaterial, updateMaterial, pushMaterialArchive } from "@/api/foundation/material";
import SelectSupplier from '@/components/SelectModel/SelectSupplier';
import SelectFactory from '@/components/SelectModel/SelectFactory';
import SelectFinanceCategory from "@/components/SelectModel/SelectFinanceCategory";
import SelectWarehouseCategory from "@/components/SelectModel/SelectWarehouseCategory";
import SelectUnit from "@/components/SelectModel/SelectUnit";
import SelectLocation from "@/components/SelectModel/SelectLocation";
import { pinyin } from 'pinyin-pro'
import { getToken } from "@/utils/auth";

export default {
  name: "Material",
  dicts: ['is_use_status', 'is_yes_no','way_status','material_level_status', 'register_level_status','risk_level_status','firstaid_level_status','doctor_level_status'],
  components: {SelectSupplier,SelectFactory,SelectFinanceCategory,SelectWarehouseCategory,SelectUnit,SelectLocation},
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
        isGz: undefined,
        storeroomId: undefined,
        financeCategoryId: undefined,
        factoryId: undefined,
        locationId: undefined,
        isFollow: undefined,
        isBilling: undefined,
        isUse: '1', // 默认启用
        udiNo: undefined,
        registerNo: undefined,
        sunshineCode: undefined,
        nameSearch: undefined, // 用于名称/编码/首字母综合搜索
        beginDate: undefined,
        endDate: undefined,
      },
      // 表单参数
      form: {},
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
        { key: 22, label: `品牌`, visible: false }
      ],
      // 表单校验
      rules: {
        code: [
          { required: true, message: "耗材编码不能为空", trigger: "blur" },
          { validator: (rule, value, callback) => {
            if (!value) {
              callback();
              return;
            }
            
            // 只验证编码不能为空，不限制长度和格式
            // 手工输入的编码可以是任意长度和格式
            // 自动生成的编码仍然是6位数字
            
            // 检查编码是否已存在（排除当前编辑的记录）
            listMaterial({ code: value, pageNum: 1, pageSize: 1 }).then(response => {
              if (response.rows && response.rows.length > 0) {
                const existingMaterial = response.rows[0];
                // 如果是新增模式，或者存在其他记录的编码，则报错
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
        supplierId: [
          { required: true, message: "供应商不能为空", trigger: "blur" }
        ],
        speci: [
          { required: true, message: "规格不能为空", trigger: "blur" }
        ],
        model: [
          { required: true, message: "型号不能为空", trigger: "blur" }
        ],
        price: [
          { required: true, message: "价格不能为空", trigger: "blur" }
        ],
        referredName: [
          { required: true, message: "名称简码不能为空", trigger: "blur" }
        ],
        factoryId: [
          { required: true, message: "生产厂家不能为空", trigger: "blur" }
        ],
        storeroomId: [
          { required: true, message: "库房分类不能为空", trigger: "blur" }
        ],
        financeCategoryId: [
          { required: true, message: "财务分类不能为空", trigger: "blur" }
        ],
        unitId: [
          { required: true, message: "单位不能为空", trigger: "blur" }
        ],
      },
      // 用户导入参数
      upload: {
        // 是否显示弹出层（用户导入）
        open: false,
        // 弹出层标题（用户导入）
        title: "",
        // 是否禁用上传
        isUploading: false,
        // 是否更新已经存在的用户数据
        updateSupport: 0,
        // 设置上传的请求头部
        headers: { Authorization: "Bearer " + getToken() },
        // 上传的地址
        url: process.env.VUE_APP_BASE_API + "/foundation/material/importData"
      },
      // 上传的文件
      uploadFile: null,
      // 解析结果
      parseResult: {
        show: false,
        success: false,
        message: '',
        errors: []
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
        sunshineCoefficient: null
      };
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
      this.queryParams.isUse = '1'; // 重置为默认启用
      this.handleQuery();
    },
    /** 导入按钮操作 */
    handleImport() {
      this.upload.title = "耗材导入";
      this.upload.open = true;
      this.uploadFile = null;
      this.parseResult = {
        show: false,
        success: false,
        message: '',
        errors: []
      };
    },
    /** 下载模板操作 */
    importTemplate() {
      this.download('foundation/material/importTemplate', {
      }, `耗材产品档案基础字典导入.xlsx`)
    },
    // 文件选择变化处理
    handleFileChange(file, fileList) {
      if (fileList && fileList.length > 0) {
        // 保存文件对象，优先使用raw，如果没有则使用file本身
        this.uploadFile = file.raw || file;
        // 重置解析结果
        this.parseResult = {
          show: false,
          success: false,
          message: '',
          errors: []
        };
      } else {
        this.uploadFile = null;
      }
    },
    // 文件上传中处理
    handleFileUploadProgress(event, file, fileList) {
      this.upload.isUploading = true;
    },
    // 文件上传成功处理
    handleFileSuccess(response, file, fileList) {
      this.upload.open = false;
      this.upload.isUploading = false;
      this.uploadFile = null;
      this.parseResult.show = false;
      this.$refs.upload.clearFiles();
      this.$alert("<div style='overflow: auto;overflow-x: hidden;max-height: 70vh;padding: 10px 20px 0;'>" + response.msg + "</div>", "导入结果", { dangerouslyUseHTMLString: true });
      this.getList();
    },
    // 提交上传文件
    submitFileForm() {
      this.$refs.upload.submit();
    },
    // 解析Excel文件
    parseExcelFile() {
      console.log('parseExcelFile called, uploadFile:', this.uploadFile);
      if (!this.uploadFile) {
        this.$modal.msgWarning("请先选择要解析的文件");
        return;
      }

      // 显示解析中状态
      this.parseResult = {
        show: true,
        success: false,
        message: '正在解析文件，请稍候...',
        errors: []
      };

      // 动态加载xlsx库
      if (typeof window.XLSX === 'undefined') {
        // 检查是否已经有脚本标签
        let existingScript = document.querySelector('script[src*="xlsx"]');
        if (existingScript && existingScript.getAttribute('data-loaded') !== 'true') {
          // 如果脚本已存在但未加载完成，等待加载
          existingScript.addEventListener('load', () => {
            existingScript.setAttribute('data-loaded', 'true');
            this.doParseExcel();
          });
          return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
        script.onload = () => {
          script.setAttribute('data-loaded', 'true');
          this.doParseExcel();
        };
        script.onerror = () => {
          this.parseResult = {
            show: true,
            success: false,
            message: '加载Excel解析库失败，请检查网络连接',
            errors: []
          };
          this.$modal.msgError("加载Excel解析库失败，请检查网络连接");
        };
        document.head.appendChild(script);
      } else {
        this.doParseExcel();
      }
    },
    // 执行Excel解析
    doParseExcel() {
      console.log('doParseExcel called');
      const file = this.uploadFile;
      if (!file) {
        this.parseResult = {
          show: true,
          success: false,
          message: '文件不存在，请重新选择文件',
          errors: []
        };
        return;
      }

      if (typeof window.XLSX === 'undefined') {
        this.parseResult = {
          show: true,
          success: false,
          message: 'Excel解析库未加载，请刷新页面重试',
          errors: []
        };
        return;
      }

      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          console.log('FileReader onload, file size:', e.target.result.byteLength);
          const data = new Uint8Array(e.target.result);
          const workbook = window.XLSX.read(data, { type: 'array' });
          console.log('Workbook loaded, sheets:', workbook.SheetNames);
          
          if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            this.parseResult = {
              show: true,
              success: false,
              message: 'Excel文件格式不正确，无法读取工作表',
              errors: []
            };
            return;
          }

          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // 转换为JSON数组
          const jsonData = window.XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
          
          if (jsonData.length < 2) {
            this.parseResult = {
              show: true,
              success: false,
              message: 'Excel文件数据为空，至少需要表头和数据行',
              errors: []
            };
            return;
          }

          // 获取表头（第一行），去掉星号
          const headers = jsonData[0].map(h => {
            if (!h) return '';
            const headerStr = String(h).trim();
            return headerStr.replace(/\*$/, '');
          });
          
          // 必填字段映射（Excel列名 -> 字段名）
          const requiredFields = {
            '耗材编码': 'code',
            '耗材名称': 'name',
            '供应商': 'supplierId',
            '规格': 'speci',
            '型号': 'model',
            '价格': 'price',
            '生产厂家': 'factoryId',
            '库房分类': 'storeroomId',
            '财务分类': 'financeCategoryId',
            '单位': 'unitId'
          };

          // 验证每行数据
          const errors = [];
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || row.length === 0) {
              continue; // 跳过空数组
            }
            const rowNum = i + 1; // Excel行号（从2开始，因为有表头）
            
            // 检查是否为空行
            const isEmptyRow = row.every(cell => !cell || String(cell).trim() === '');
            if (isEmptyRow) {
              continue; // 跳过空行
            }

            // 检查每个必填字段
            for (let j = 0; j < headers.length; j++) {
              const header = headers[j];
              const fieldName = requiredFields[header];
              
              if (fieldName) {
                const cellValue = row[j];
                if (!cellValue || String(cellValue).trim() === '') {
                  errors.push(`第${rowNum}行，${header}字段未填写`);
                }
              }
            }
          }

          if (errors.length === 0) {
            this.parseResult = {
              show: true,
              success: true,
              message: `解析成功！共${jsonData.length - 1}行数据，所有必填字段均已填写。`,
              errors: []
            };
          } else {
            this.parseResult = {
              show: true,
              success: false,
              message: `解析完成，发现${errors.length}个必填字段未填写：`,
              errors: errors.slice(0, 50) // 最多显示50个错误
            };
          }
        } catch (error) {
          this.parseResult = {
            show: true,
            success: false,
            message: `解析失败：${error.message}`,
            errors: []
          };
        }
      };

      reader.onerror = () => {
        this.parseResult = {
          show: true,
          success: false,
          message: '文件读取失败，请重试',
          errors: []
        };
      };

      reader.readAsArrayBuffer(file);
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 生成6位数字编码 */
    async generateCode() {
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
        // 如果没有输入编码，自动生成
        this.form.code = await this.generateCode();
        // 触发验证
        this.$nextTick(() => {
          this.$refs.form.validateField('code');
        });
      } else {
        // 如果有输入，验证唯一性
        this.$refs.form.validateField('code');
      }
    },
    /** 新增按钮操作 */
    async handleAdd() {
      this.reset();
      this.open = true;
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
      // 自动生成6位数字编码
      this.form.code = await this.generateCode();
      this.activeTab = 'form'; // 默认显示表单视图
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
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
        this.open = true;
        this.isDisabled = true;
        this.title = "修改耗材产品";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != null) {
            updateMaterial(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addMaterial(this.form).then(response => {
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
</style>

