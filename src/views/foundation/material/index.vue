<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">

      <el-row class="query-row-first">
        <el-col :span="24">
          <el-form-item label="供应商" prop="supplierId" class="query-item-inline">
            <div class="query-select-wrapper">
              <SelectSupplier v-model="queryParams.supplierId"/>
            </div>
          </el-form-item>

          <el-form-item label="耗材名称" prop="name" class="query-item-inline">
            <el-input
              v-model="queryParams.name"
              placeholder="请输入耗材名称"
              clearable
              @keyup.enter.native="handleQuery"
              style="width: 180px"
            />
          </el-form-item>

          <el-form-item label="UDI码" prop="udiNo" class="query-item-inline">
            <el-input
              v-model="queryParams.udiNo"
              placeholder="请输入UDI码（支持模糊查询）"
              clearable
              @keyup.enter.native="handleQuery"
              style="width: 180px"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row class="query-row-second">
        <el-col :span="24">
          <el-form-item label="库房分类" prop="storeroomId" class="query-item-inline">
            <div class="query-select-wrapper">
              <SelectWarehouseCategory v-model="queryParams.storeroomId"/>
            </div>
          </el-form-item>

          <el-form-item label="财务分类" prop="financeCategoryId" class="query-item-inline">
            <div class="query-select-wrapper">
              <SelectFinanceCategory v-model="queryParams.financeCategoryId"/>
            </div>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row class="query-row-third">
        <el-col :span="24">
          <el-form-item label="创建日期" style="display: flex; align-items: center;" class="query-item-inline">
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
        </el-col>
      </el-row>

    </el-form>
    <el-row :gutter="10" class="mb8" style="padding-top: 10px">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="small"
          @click="handleAdd"
          v-hasPermi="['foundation:material:add']"
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
          v-hasPermi="['foundation:material:edit']"
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
          v-hasPermi="['foundation:material:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="small"
          @click="handleExport"
          v-hasPermi="['foundation:material:export']"
        >导出</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="info"
          icon="el-icon-upload2"
          size="small"
          @click="handleImport"
          v-hasPermi="['foundation:material:import']"
        >导入</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          icon="el-icon-upload"
          size="small"
          :disabled="!queryParams.supplierId"
          @click="handlePushArchive"
          v-hasPermi="['foundation:material:push']"
        >推送档案</el-button>
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
          icon="el-icon-refresh"
          size="small"
          @click="resetQuery"
        >重置</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="materialList" :row-class-name="materialIndex" @selection-change="handleSelectionChange" height="58vh" border>
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column type="index" label="序号" align="center" width="80" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column label="耗材编码" align="center" prop="code" width="100" show-overflow-tooltip resizable/>
      <el-table-column label="耗材名称" align="center" prop="name" width="180" show-overflow-tooltip resizable/>
      <el-table-column label="规格" align="center" prop="speci" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="型号" align="center" prop="model" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="价格" align="center" prop="price" width="100" show-overflow-tooltip resizable/>
      <el-table-column label="单位" align="center" prop="fdUnit.unitName" width="80" show-overflow-tooltip resizable/>
      <el-table-column label="生产厂家" align="center" prop="fdFactory.factoryName" width="150" show-overflow-tooltip resizable/>
      <el-table-column label="供应商" align="center" prop="supplier.name" width="180" show-overflow-tooltip resizable/>
      <el-table-column label="库房分类" align="center" prop="fdWarehouseCategory.warehouseCategoryName" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="储存方式" align="center" prop="isWay" width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.way_status" :value="scope.row.isWay"/>
        </template>
      </el-table-column>
      <el-table-column label="货位" align="center" prop="fdLocation.locationName" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.fdLocation && scope.row.fdLocation.locationName">{{ scope.row.fdLocation.locationName }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="启用" align="center" prop="isUse" width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.isUse === '1' || scope.row.isUse === 1 ? '是' : '否' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="高值" align="center" prop="isGz" width="80" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.is_yes_no" :value="scope.row.isGz"/>
        </template>
      </el-table-column>
      <el-table-column label="跟台" align="center" prop="isFollow" width="80" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.is_yes_no" :value="scope.row.isFollow"/>
        </template>
      </el-table-column>
      <el-table-column label="计费" align="center" prop="isBilling" width="80" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.isBilling === '1' || scope.row.isBilling === 1 ? '是' : '否' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="品牌" align="center" prop="brand" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="创建日期" align="center" prop="createTime" width="100" show-overflow-tooltip resizable>
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
          <el-button icon="el-icon-close" size="small" circle @click="cancel" class="close-btn"></el-button>
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

              <!-- 第八行 -->
          <el-row :gutter="20">
                <el-col :span="3">
                  <el-form-item label="" prop="isUse">
                    <div class="switch-with-label-left">
                      <span class="switch-label" :class="{ 'active': form.isUse === '1' }">启用</span>
                      <el-switch
                        v-model="form.isUse"
                        :active-value="'1'"
                        :inactive-value="'2'"
                      ></el-switch>
                    </div>
              </el-form-item>
            </el-col>
                <el-col :span="3">
                  <el-form-item label="" prop="isBilling">
                    <div class="switch-with-label-left">
                      <span class="switch-label" :class="{ 'active': form.isBilling === '1' }">计费</span>
                      <el-switch
                        v-model="form.isBilling"
                        :active-value="'1'"
                        :inactive-value="'2'"
                      ></el-switch>
                    </div>
              </el-form-item>
            </el-col>
                <el-col :span="3">
                  <el-form-item label="" prop="isGz">
                    <div class="switch-with-label-left">
                      <span class="switch-label" :class="{ 'active': form.isGz === '1' }">高值</span>
                      <el-switch
                        v-model="form.isGz"
                        :active-value="'1'"
                        :inactive-value="'2'"
                      ></el-switch>
                    </div>
              </el-form-item>
            </el-col>
                <el-col :span="3">
                  <el-form-item label="" prop="isFollow">
                    <div class="switch-with-label-left">
                      <span class="switch-label" :class="{ 'active': form.isFollow === '1' }">跟台</span>
                      <el-switch
                        v-model="form.isFollow"
                        :active-value="'1'"
                        :inactive-value="'2'"
                      ></el-switch>
                    </div>
              </el-form-item>
            </el-col>
                <el-col :span="3">
                  <el-form-item label="" prop="isMonitor">
                    <div class="switch-with-label-left">
                      <span class="switch-label" :class="{ 'active': form.isMonitor === '1' }" style="white-space: nowrap;">重点监测</span>
                      <el-switch
                        v-model="form.isMonitor"
                        :active-value="'1'"
                        :inactive-value="'2'"
                      ></el-switch>
                    </div>
              </el-form-item>
            </el-col>
                <el-col :span="4">
                </el-col>
                <el-col :span="5">
                </el-col>
          </el-row>

              <!-- 第九行 -->
          <el-row :gutter="20">
                <el-col :span="4">
                  <el-form-item label="货位：" prop="locationId">
                    <SelectLocation v-model="form.locationId" />
              </el-form-item>
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
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
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
        <div class="dialog-footer" style="text-align:right;margin-top:16px;">
        <el-button type="primary" @click="submitFileForm">确 定</el-button>
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
        isFollow: undefined,
        isUse: undefined,
        udiNo: undefined,
        beginDate: undefined,
        endDate: undefined,
      },
      // 表单参数
      form: {},
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
        isUse: '2', // 默认停用
        beginDate: null,
        endDate: null,
        imageUrl: null,
        sunshineCode: null,
        locationId: null
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
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.beginDate = null;
      this.queryParams.endDate = null;
      this.handleQuery();
    },
    /** 导入按钮操作 */
    handleImport() {
      this.upload.title = "耗材导入";
      this.upload.open = true;
    },
    /** 下载模板操作 */
    importTemplate() {
      this.download('foundation/material/importTemplate', {
      }, `fdmaterial_template_${new Date().getTime()}.xlsx`)
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
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.local-modal-content {
  background: #fff;
  border-radius: 6px;
  min-width: 600px;
  max-width: 95vw;
  max-height: 95vh;
  overflow: visible;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
}

.local-modal-content.material-modal-content {
  width: 1700px !important;
  min-width: 1700px !important;
  min-height: 880px !important;
}

.local-modal-content.material-modal-content > .el-tabs {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
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
  margin-bottom: 8px;
}

.app-container > .el-form .el-row:last-child {
  margin-bottom: 0;
}

.app-container > .el-form .el-form-item {
  margin-bottom: 0;
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

.app-container > .el-form .query-row-left .query-item-inline .query-select-wrapper {
  width: 180px;
  display: inline-block;
}

.app-container > .el-form .query-row-left .query-item-inline .query-select-wrapper > * {
  width: 100%;
}

.app-container > .el-form .query-row-left .query-item-inline .el-select {
  width: 150px;
}

/* 第二行日期范围布局 */
.app-container > .el-form .query-row-second {
  position: relative;
}

/* 第三行字段间距调整 - 状态、高值、跟台更紧凑 */
.app-container > .el-form .query-row-third .query-item-inline {
  margin-right: 8px !important;
}

.app-container > .el-form .query-row-third .query-item-inline:last-child {
  margin-right: 0 !important;
}

/* 高值和跟台字段更紧凑 */
.app-container > .el-form .query-row-third .query-item-compact {
  margin-right: 4px !important;
}

.app-container > .el-form .query-row-third .query-item-compact + .query-item-compact {
  margin-left: 0 !important;
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
  width: 1700px !important;
  min-width: 1700px !important;
  max-width: 95vw !important;
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

/* 表格滚动条样式 - 减小四分之一 */
.el-table__body-wrapper::-webkit-scrollbar {
  width: 6px !important;
  height: 12px !important;
}

.el-table__body-wrapper::-webkit-scrollbar:vertical {
  width: 6px !important;
}

.el-table__body-wrapper::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

.el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

.el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #c1c1c1 !important;
  border-radius: 3px !important;
  min-width: 2px !important;
  min-height: 4px !important;
  /* 通过background-clip和padding来减小滚动条滑块视觉长度 */
  background-clip: padding-box;
  border: 2px solid transparent;
}

.el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8 !important;
}

/* 针对Element UI表格的滚动条组件 */
.el-table .el-scrollbar__bar.is-vertical {
  width: 6px !important;
}

.el-table .el-scrollbar__bar.is-horizontal {
  height: 12px !important;
}

.el-table .el-scrollbar__thumb {
  min-width: 2px !important;
  min-height: 4px !important;
  /* 通过设置固定尺寸来减小滚动条滑块长度 */
  width: 2px !important;
  height: 4px !important;
  max-width: 2px !important;
  max-height: 4px !important;
}
</style>

