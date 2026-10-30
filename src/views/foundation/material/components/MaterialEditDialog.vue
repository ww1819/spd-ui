<template>
    <!-- 添加或修改耗材产品局部弹窗 -->
    <div v-if="open" class="local-modal-mask material-modal-mask">
      <div class="local-modal-content material-modal-content" :class="{ 'material-modal-view': isViewMode, 'zq-material-limited-modal': zqTcmLimitedEdit }">
        <div class="modal-header material-modal-header">
          <div class="modal-title">{{ isViewMode ? '耗材档案详情' : title }}</div>
          <i class="el-icon-close material-modal-x" @click="cancel" />
        </div>
        <el-tabs v-model="activeTab" class="material-detail-tabs" @tab-click="onTabClick">
          <!-- 基础信息 -->
          <el-tab-pane name="form">
            <span slot="label">
              <el-tooltip content="耗材基础档案、资质、收费配置" placement="top" :open-delay="300">
                <span class="material-tab-label">基础信息</span>
              </el-tooltip>
            </span>
            <div class="material-tab-pane-body">
            <el-form ref="form" :model="form" :rules="rules" label-width="120px" :disabled="isViewMode" :class="{ 'zq-material-limited-edit': zqTcmLimitedEdit, 'material-form-grid': true }">
              <el-alert
                v-if="zqTcmLimitedEdit"
                type="warning"
                :closable="false"
                show-icon
                title="枣强县中医院仅可修改财务分类、生产厂家、供应商与单价，其他字段暂不可变更"
                class="zq-edit-hint"
              />
              <div class="material-detail-card">
                <div class="material-detail-card__header">
                  <i class="el-icon-document" />
                  <span>基础档案</span>
                </div>
                <div class="material-detail-card__body material-six-col-grid">
          <el-row :gutter="20">
                <el-col :span="4">
                  <el-form-item label="产品编码：" prop="code">
                <el-input
                  v-model="form.code"
                  :disabled="isDisabled || form.id != null || isHsThirdTenant"
                  :placeholder="isHsThirdTenant ? '产品编码由系统自动生成' : '产品编码（留空自动生成6位数字，手工输入可为任意长度）'"
                  @blur="validateCode"
                  @input="handleCodeInput"
                />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="产品名称：" prop="name" class="material-label-hint-red">
                <el-input v-model="form.name" @dblclick.native="openZoomEditor('name', '产品名称')" @input="nameChange" placeholder="产品名称" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="名称简码：" prop="referredName">
                <el-input v-model="form.referredName" :disabled="true" placeholder="名称简码" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="供应商：" prop="supplierId" class="zq-editable-field material-label-hint-red">
                <SelectSupplier v-model="form.supplierId" :onlyEnabled="true" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="生产厂家：" prop="factoryId" class="zq-editable-field material-label-hint-red">
                    <SelectFactory v-model="form.factoryId" :onlyEnabled="true"/>
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="规格：" prop="speci" class="material-label-hint-red">
                    <el-input v-model="form.speci" @dblclick.native="openZoomEditor('speci', '规格')" placeholder="规格" />
              </el-form-item>
            </el-col>
          </el-row>

              <!-- 第二行 -->
          <el-row :gutter="20">
                <el-col :span="4">
                  <el-form-item label="型号：" prop="model" class="material-label-hint-red">
                    <el-input v-model="form.model" @dblclick.native="openZoomEditor('model', '型号')" placeholder="型号" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="单位：" prop="unitId" class="material-label-hint-red">
                <SelectUnit v-model="form.unitId" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="单价：" prop="price" class="zq-editable-field material-label-hint-red">
                    <el-input v-model="form.price" placeholder="请输入单价" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="库房分类：" prop="storeroomId" class="material-label-hint-red">
                    <SelectWarehouseCategory v-model="form.storeroomId" @input="onStoreroomChange"/>
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="财务分类：" prop="financeCategoryId" class="zq-editable-field material-label-hint-red">
                    <SelectFinanceCategory v-model="form.financeCategoryId"/>
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="材料类别：" prop="materialCategoryId">
                    <SelectMaterialCategory v-model="form.materialCategoryId"/>
                  </el-form-item>
                </el-col>
          </el-row>

              <!-- 第三行：注册证字段 → 注册证级别 → 产地/通用名称 -->
          <el-row :gutter="20">
                <el-col :span="4">
                  <el-form-item label="注册证名称：" prop="registerName">
                    <el-input v-model="form.registerName" placeholder="注册证名称" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="注册证号：" prop="registerNo" class="material-label-hint-red">
                    <el-input v-model="form.registerNo" @dblclick.native="openZoomEditor('registerNo', '注册证号')" placeholder="注册证号" />
              </el-form-item>
            </el-col>
                <el-col :span="4" class="period-date-col">
                  <el-form-item label="注册证有效期：" prop="periodDate" class="material-label-hint-red">
                    <div
                      class="period-date-longterm-wrap"
                      @input.capture="onPeriodDateCaptureInput"
                      @blur.capture="onPeriodDateCaptureBlur"
                      @keydown.enter.capture="onPeriodDateCaptureEnter"
                    >
                      <el-date-picker
                        clearable
                        v-model="form.periodDate"
                        type="date"
                        value-format="yyyy-MM-dd"
                        class="period-date-picker"
                        placeholder="支持 20270214 / 2027/02/14 / 2027年02月14日"
                        :disabled="periodDateLongTerm"
                        @change="onPeriodDatePickerChange"
                      />
                      <el-button
                        size="mini"
                        class="period-longterm-btn"
                        :type="periodDateLongTerm ? 'primary' : 'default'"
                        @click="togglePeriodDateLongTerm"
                      >长期</el-button>
                    </div>
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
                  <el-form-item label="产地：" prop="producer">
                    <el-input v-model="form.producer" placeholder="产地" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="通用名称：" prop="useName">
                    <el-input v-model="form.useName" placeholder="通用名称" />
              </el-form-item>
            </el-col>
          </el-row>

              <!-- 第四行：医保字段在前，再货位等 -->
          <el-row :gutter="20">
                <el-col :span="4">
                  <el-form-item label="医保名称：" prop="medicalName">
                    <el-input v-model="form.medicalName" placeholder="医保名称" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="医保编码：" prop="medicalNo" class="material-label-hint-red">
                <el-input v-model="form.medicalNo" @dblclick.native="openZoomEditor('medicalNo', '医保编码')" @blur="onMedicalNoBlur" placeholder="医保编码" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="货位：" prop="locationId">
                    <SelectLocation v-model="form.locationId" />
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
          </el-row>

              <!-- 第五行：招标/入选原因后接包装、储存方式、贯标码 -->
          <el-row :gutter="20">
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
                <el-col :span="4">
                  <el-form-item label="包装规格：" prop="packageSpeci">
                    <el-input v-model="form.packageSpeci" placeholder="包装规格" />
              </el-form-item>
            </el-col>
                <el-col :span="4">
                  <el-form-item label="最小包装数：" prop="minPackageQty">
                    <el-input
                      v-model="form.minPackageQty"
                      placeholder="如 10 支/盒填 10，选填"
                      clearable
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="储存方式：" prop="isWay">
                    <el-input v-model="form.isWay" placeholder="如：常温存储、冷链存储、常温 20℃" clearable maxlength="100" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="贯标码：" prop="countryNo">
                    <el-input v-model="form.countryNo" placeholder="贯标码" />
              </el-form-item>
            </el-col>
          </el-row>

              <!-- 第六行：UDI 在品牌前；许可证编号在功能后 -->
          <el-row :gutter="20">
                <el-col :span="4">
                  <el-form-item label="UDI码：" prop="udiNo">
                <el-input v-model="form.udiNo" placeholder="UDI码" @blur="onFormUdiNoBlur" />
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
                <el-col :span="4">
                  <el-form-item label="许可证编号：" prop="permitNo">
                    <el-input v-model="form.permitNo" placeholder="许可证编号" />
              </el-form-item>
            </el-col>
          </el-row>

              <!-- 第七行：商品说明在医用级别后 -->
          <el-row :gutter="20">
                <el-col :span="4">
                  <el-form-item label="阳光平台编码：" prop="sunshineCode" class="material-label-hint-red">
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
                <el-col :span="4">
                  <el-form-item label="商品说明：" prop="description">
                    <el-input v-model="form.description" placeholder="商品说明" />
              </el-form-item>
            </el-col>
          </el-row>

              <!-- 第八行 -->
          <el-row :gutter="20">
                <el-col :span="4">
                  <el-form-item label="备注：" prop="countryName">
                <el-input v-model="form.countryName" @dblclick.native="openZoomEditor('countryName', '备注')" placeholder="备注" />
                  </el-form-item>
                </el-col>
          </el-row>

                </div>
              </div>

              <!-- 业务开关 -->
              <div class="material-detail-card">
                <div class="material-detail-card__header">
                  <i class="el-icon-setting" />
                  <span>业务开关</span>
                </div>
                <div class="material-detail-card__body">
          <el-row :gutter="20">
            <el-col :span="24">
              <div class="switch-container switch-container--square">
                <div class="switch-row switch-row-single">
                  <el-form-item label="" prop="isUse" class="switch-form-item switch-form-item-is-use">
                    <div class="switch-with-label-left">
                      <span class="switch-label" :class="{ active: form.isUse === '1' }">
                        <span class="switch-required-mark">*</span>启用
                      </span>
                      <el-switch
                        v-model="form.isUse"
                        :active-value="'1'"
                        :inactive-value="'2'"
                        @change="onIsUseChange"
                      />
                    </div>
                  </el-form-item>
                  <el-form-item label="" prop="isTemporaryPurchase" class="switch-form-item">
                    <div class="switch-with-label-left">
                      <span class="switch-label" :class="{ 'active': form.isTemporaryPurchase === '1' }" style="white-space: nowrap;">临购</span>
                      <el-switch
                        v-model="form.isTemporaryPurchase"
                        :active-value="'1'"
                        :inactive-value="'2'"
                      />
                    </div>
                  </el-form-item>
                  <el-form-item label="" prop="isBilling" class="switch-form-item">
                    <div class="switch-with-label-left">
                      <span class="switch-label" :class="{ 'active': form.isBilling === '1' }">计费</span>
                      <el-switch
                        v-model="form.isBilling"
                        :active-value="'1'"
                        :inactive-value="'2'"
                      />
                    </div>
                  </el-form-item>
                  <el-form-item label="" prop="isServiceFee" class="switch-form-item">
                    <div class="switch-with-label-left">
                      <span class="switch-label" :class="{ 'active': form.isServiceFee === '1' }">服务费</span>
                      <el-switch
                        v-model="form.isServiceFee"
                        :active-value="'1'"
                        :inactive-value="'2'"
                      />
                    </div>
                  </el-form-item>
                  <el-form-item label="" prop="isGz" class="switch-form-item">
                    <div class="switch-with-label-left">
                      <span class="switch-label" :class="{ 'active': form.isGz === '1' }">高值</span>
                      <el-switch
                        v-model="form.isGz"
                        :active-value="'1'"
                        :inactive-value="'2'"
                      />
                    </div>
                  </el-form-item>
                  <el-form-item label="" prop="isFollow" class="switch-form-item">
                    <div class="switch-with-label-left">
                      <span class="switch-label" :class="{ 'active': form.isFollow === '1' }">跟台</span>
                      <el-switch
                        v-model="form.isFollow"
                        :active-value="'1'"
                        :inactive-value="'2'"
                      />
                    </div>
                  </el-form-item>
                  <el-form-item label="" prop="isMonitor" class="switch-form-item">
                    <div class="switch-with-label-left">
                      <span class="switch-label" :class="{ 'active': form.isMonitor === '1' }" style="white-space: nowrap;">重点监测</span>
                      <el-switch
                        v-model="form.isMonitor"
                        :active-value="'1'"
                        :inactive-value="'2'"
                      />
                    </div>
                  </el-form-item>
                  <el-form-item label="" prop="isCentralizedProcurement" class="switch-form-item">
                    <div class="switch-with-label-left">
                      <span class="switch-label" :class="{ 'active': form.isProcure === '1' }">集采</span>
                      <el-switch
                        v-model="form.isProcure"
                        :active-value="'1'"
                        :inactive-value="'2'"
                      />
                    </div>
                  </el-form-item>
                  <el-form-item label="" prop="isSunshineProcurement" class="switch-form-item">
                    <div class="switch-with-label-left">
                      <span class="switch-label" :class="{ 'active': form.isSunshineProcurement === '1' }">阳采</span>
                      <el-switch
                        v-model="form.isSunshineProcurement"
                        :active-value="'1'"
                        :inactive-value="'2'"
                      />
                    </div>
                  </el-form-item>
                </div>
                <el-row v-if="form.isProcure === '1'" :gutter="20" style="margin-top: 8px;">
                  <el-col :span="8">
                    <el-form-item label="集采类型：" prop="jcTypeId">
                      <SelectJcType v-model="form.jcTypeId" placeholder="请选择集采类型" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <div
                  v-if="form.id && form.isUse !== originalIsUse"
                  class="switch-status-reason-row"
                >
                  <el-form-item label="状态变更原因：" prop="statusChangeReason" class="status-reason-form-item">
                    <el-input
                      v-model="form.statusChangeReason"
                      type="textarea"
                      :rows="2"
                      :placeholder="form.isUse === '1' ? '请填写启用原因' : '请填写停用原因'"
                    />
                  </el-form-item>
                </div>
              </div>
            </el-col>
          </el-row>
                </div>
              </div>

              <!-- 18类重点耗材 -->
              <div class="material-detail-card">
                <div class="material-detail-card__header">
                  <i class="el-icon-document" />
                  <span>18类重点耗材</span>
                </div>
                <div class="material-detail-card__body material-six-col-grid focus18-material-grid">
                  <el-row :gutter="20">
                    <el-col :span="4">
                      <el-form-item label="耗材类别：" prop="focus18Category">
                        <el-input v-model="form.focus18Category" placeholder="耗材类别" maxlength="100" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="4">
                      <el-form-item label="耗材分类代码：" prop="focus18ClassCode">
                        <el-input v-model="form.focus18ClassCode" placeholder="耗材分类代码" maxlength="100" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="4">
                      <el-form-item label="通用名代码：" prop="focus18GenericCode">
                        <el-input v-model="form.focus18GenericCode" placeholder="通用名代码" maxlength="100" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="4">
                      <el-form-item label="医保通用名：" prop="focus18MedicalGenericName">
                        <el-input v-model="form.focus18MedicalGenericName" placeholder="医保通用名" maxlength="200" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="4">
                      <el-form-item label="材质代码：" prop="focus18MaterialCode">
                        <el-input v-model="form.focus18MaterialCode" placeholder="材质代码" maxlength="100" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="4">
                      <el-form-item label="材质：" prop="focus18Material">
                        <el-input v-model="form.focus18Material" placeholder="材质" maxlength="200" />
                      </el-form-item>
                    </el-col>
                  </el-row>
                  <el-row :gutter="20">
                    <el-col :span="8">
                      <el-form-item label="一级分类(学科/品类)：" prop="focus18Level1" label-width="160px">
                        <el-input v-model="form.focus18Level1" placeholder="一级分类" maxlength="200" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="8">
                      <el-form-item label="二级分类(用途/品目)：" prop="focus18Level2" label-width="160px">
                        <el-input v-model="form.focus18Level2" placeholder="二级分类" maxlength="200" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="8">
                      <el-form-item label="三级分类(部位/功能/品种)：" prop="focus18Level3" label-width="190px">
                        <el-input v-model="form.focus18Level3" placeholder="三级分类" maxlength="200" />
                      </el-form-item>
                    </el-col>
                  </el-row>
                  <el-row :gutter="20">
                    <el-col :span="4">
                      <el-form-item label="特征代码：" prop="focus18FeatureCode">
                        <el-input v-model="form.focus18FeatureCode" placeholder="特征代码" maxlength="100" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="4">
                      <el-form-item label="特征参数：" prop="focus18FeatureParam">
                        <el-input v-model="form.focus18FeatureParam" placeholder="特征参数" maxlength="500" />
                      </el-form-item>
                    </el-col>
                  </el-row>
                </div>
              </div>

              <!-- 收费项目（HIS 镜像对照，只读；维护页修改档案时一并提交 hisId/hisChargeItemId 避免被清空） -->
          <el-row v-if="form.id" :gutter="20">
            <el-col :span="24">
              <div class="material-detail-card his-compare-container">
                <div class="material-detail-card__header his-compare-header">
                  <i class="el-icon-money" />
                  <span class="his-compare-title">收费项目信息（HIS）</span>
                </div>
                <div class="his-compare-content material-six-col-grid">
                  <el-row :gutter="20">
                    <el-col :span="4">
                      <el-form-item label="收费项ID：">
                        <el-input :value="form.hisChargeItemId || '--'" disabled />
                      </el-form-item>
                    </el-col>
                    <el-col :span="4">
                      <el-form-item label="收费名称：">
                        <el-input :value="form.hisChargeItemName || '--'" disabled />
                      </el-form-item>
                    </el-col>
                    <el-col :span="4">
                      <el-form-item label="收费规格：">
                        <el-input :value="form.hisChargeItemSpeci || '--'" disabled />
                      </el-form-item>
                    </el-col>
                    <el-col :span="4">
                      <el-form-item label="收费单价：">
                        <el-input :value="form.hisChargeItemPrice != null && form.hisChargeItemPrice !== '' ? formatPrice4(form.hisChargeItemPrice) : '--'" disabled />
                      </el-form-item>
                    </el-col>
                  </el-row>
                </div>
              </div>
            </el-col>
          </el-row>

              <!-- 第九行 - HIS对照框 -->
          <el-row :gutter="20">
            <el-col :span="24">
              <div v-if="!isEditMode" class="material-detail-card his-compare-container">
                <div class="material-detail-card__header his-compare-header">
                  <i class="el-icon-connection" />
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
              <div class="material-detail-card sunshine-platform-container">
                <div class="material-detail-card__header sunshine-platform-header">
                  <i class="el-icon-sunny" />
                  <span class="sunshine-platform-title">阳光平台信息</span>
                </div>
                <div class="sunshine-platform-content material-six-col-grid">
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
              <div class="material-detail-card hrp-compare-container">
                <div class="material-detail-card__header hrp-compare-header">
                  <i class="el-icon-link" />
                  <span class="hrp-compare-title">HRP对照</span>
                </div>
                <div class="hrp-compare-content material-six-col-grid">
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
                      <el-form-item label="HRP型号：" prop="hrpSeq">
                        <el-input v-model="form.hrpSeq" placeholder="HRP型号" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="4">
                      <el-form-item label="HRP单位：" prop="hrpUnit">
                        <el-input v-model="form.hrpUnit" placeholder="HRP单位" />
                      </el-form-item>
                    </el-col>
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
            </div>
          </el-tab-pane>

          <!-- 产品图片 -->
          <el-tab-pane name="image">
            <span slot="label">
              <el-tooltip content="耗材外包装、注册证附件图片" placement="top" :open-delay="300">
                <span class="material-tab-label">产品图片</span>
              </el-tooltip>
            </span>
            <div class="material-tab-pane-body">
            <div class="material-detail-card">
              <div class="material-detail-card__header">
                <i class="el-icon-picture-outline" />
                <span>产品图片</span>
              </div>
              <div class="material-detail-card__body image-tab-content" style="text-align: center; padding: 40px 20px;">
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
                :disabled="isViewMode || zqTcmLimitedEdit"
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
                <template v-if="!zqTcmLimitedEdit">
                  <el-button type="primary" @click="saveImage">保存</el-button>
                  <el-button type="primary" @click="removeImage">删除图片</el-button>
                </template>
              </div>
              <div v-else-if="form.imageUrl && isViewMode" style="margin-top: 20px;">
                <el-button type="primary" @click="previewImage">查看图片</el-button>
              </div>
            </div>
              </div>
            </div>
            </div>
          </el-tab-pane>

          <!-- 启用停用记录（查看详情时显示） -->
          <el-tab-pane v-if="form.id && isViewMode" name="statusLog">
            <span slot="label">
              <el-tooltip content="耗材启用 / 停用操作流水日志" placement="top" :open-delay="300">
                <span class="material-tab-label">启用停用记录</span>
              </el-tooltip>
            </span>
            <div class="material-tab-pane-body">
            <div class="material-detail-card">
              <div class="material-detail-card__header">
                <i class="el-icon-time" />
                <span>启用停用记录</span>
              </div>
              <div class="material-detail-card__body log-tab-content">
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
            </div>
            </div>
          </el-tab-pane>
          <!-- 变更记录（查看详情时显示，左侧时间轴 + 右侧变更记录表） -->
          <el-tab-pane v-if="form.id && isViewMode" name="changeLog">
            <span slot="label">
              <el-tooltip content="耗材全量修改变更记录" placement="top" :open-delay="300">
                <span class="material-tab-label">变更记录</span>
              </el-tooltip>
            </span>
            <div class="material-tab-pane-body">
            <div class="material-detail-card">
              <div class="material-detail-card__header">
                <i class="el-icon-edit-outline" />
                <span>变更记录</span>
              </div>
              <div class="material-detail-card__body log-tab-content change-log-with-timeline">
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
                        :color="item.type === 'enable' ? '#10B981' : (item.type === 'disable' ? '#ef4444' : '#2563eb')"
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
            </div>
            </div>
          </el-tab-pane>
          <el-tab-pane v-if="form.id && isViewMode" name="inboundRecords">
            <span slot="label">
              <el-tooltip content="该耗材全部到货入库单据" placement="top" :open-delay="300">
                <span class="material-tab-label">入库记录</span>
              </el-tooltip>
            </span>
            <div class="material-tab-pane-body">
            <div class="material-detail-card">
              <div class="material-detail-card__header">
                <i class="el-icon-box" />
                <span>入库记录</span>
              </div>
              <div class="material-detail-card__body">
            <MaterialInboundRecords ref="inboundRecordsRef" :material-id="form.id" />
              </div>
            </div>
            </div>
          </el-tab-pane>
        </el-tabs>
        <div class="material-modal-footer">
          <template v-if="!isViewMode">
            <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="submitForm">确 定</el-button>
            <el-button size="small" class="spd-btn spd-btn--secondary" @click="cancel">取 消</el-button>
          </template>
          <el-button v-else size="small" class="spd-btn spd-btn--secondary" @click="cancel">关 闭</el-button>
        </div>
      </div>
    </div>
</template>

<script>
import hostProxyMixin from './hostProxyMixin'
import SelectSupplier from '@/components/SelectModel/SelectSupplier'
import SelectFactory from '@/components/SelectModel/SelectFactory'
import SelectFinanceCategory from '@/components/SelectModel/SelectFinanceCategory'
import SelectMaterialCategory from '@/components/SelectModel/SelectMaterialCategory'
import SelectWarehouseCategory from '@/components/SelectModel/SelectWarehouseCategory'
import SelectUnit from '@/components/SelectModel/SelectUnit'
import SelectLocation from '@/components/SelectModel/SelectLocation'
import SelectJcType from '@/components/SelectModel/SelectJcType'
import MaterialInboundRecords from '@/views/foundation/material/components/MaterialInboundRecords'

export default {
  name: 'MaterialEditDialog',
  mixins: [hostProxyMixin],
  dicts: ['is_use_status', 'is_yes_no', 'way_status', 'material_level_status', 'register_level_status', 'risk_level_status', 'firstaid_level_status', 'doctor_level_status'],
  components: { SelectSupplier, SelectFactory, SelectFinanceCategory, SelectMaterialCategory, SelectWarehouseCategory, SelectUnit, SelectLocation, SelectJcType, MaterialInboundRecords },
  inheritAttrs: false
}
</script>

<style>
/* 相对本页容器定位，不盖侧栏/顶栏；无四周灰边（padding=0） */
.material-page-container .local-modal-mask.material-modal-mask,
.local-modal-mask.material-modal-mask {
  position: absolute !important;
  left: 0 !important;
  top: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  padding: 0 !important;
  width: auto !important;
  max-width: none !important;
  box-sizing: border-box;
  display: flex !important;
  align-items: stretch !important;
  justify-content: stretch !important;
  background: transparent !important;
  z-index: 2000;
}

.material-page-container .local-modal-mask.material-modal-mask > .local-modal-content.material-modal-content,
.local-modal-mask.material-modal-mask > .local-modal-content.material-modal-content,
.local-modal-content.material-modal-content {
  width: 100% !important;
  height: 100% !important;
  min-width: 0 !important;
  min-height: 0 !important;
  max-width: none !important;
  max-height: none !important;
  margin: 0;
  padding: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  overflow: hidden !important;
  background: #fff !important;
  display: flex !important;
  flex-direction: column !important;
}

.material-modal-content .modal-header.material-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  margin: 0 !important;
  width: 100% !important;
  min-height: 48px;
  padding: 10px 16px !important;
  box-sizing: border-box;
  background: #fff;
  border: none;
  border-bottom: 1px solid #E5E6EB;
  border-radius: 0 !important;
  box-shadow: none !important;
}

.material-modal-content .modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

.material-modal-x {
  font-size: 16px;
  color: #909399;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
}

.material-modal-x:hover {
  color: #409EFF;
}

.material-modal-content > .el-tabs.material-detail-tabs {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #F5F7FA;
}

.material-modal-content > .el-tabs.material-detail-tabs > .el-tabs__header {
  flex-shrink: 0;
  margin: 0;
  background: #fff;
  z-index: 10;
  padding: 0 16px;
  border-bottom: 1px solid #E5E6EB;
}

.material-modal-content > .el-tabs.material-detail-tabs > .el-tabs__content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0;
  background: #F5F7FA;
}

.material-modal-footer {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 10px 16px;
  background: #fff;
  border-top: 1px solid #E5E6EB;
  border-radius: 0;
}

.material-modal-footer .el-button {
  min-width: 72px;
  margin: 0;
}

/* 注册证有效期 + 长期：同一行 */
.material-modal-content .period-date-longterm-wrap {
  display: flex !important;
  align-items: center;
  gap: 6px;
  width: 100%;
  position: relative;
}
.material-modal-content .period-date-longterm-wrap .period-date-picker.el-date-editor {
  flex: 1 1 auto;
  min-width: 0;
  width: auto !important;
}
.material-modal-content .period-date-longterm-wrap .period-longterm-btn.el-button {
  position: static !important;
  left: auto !important;
  top: auto !important;
  transform: none !important;
  flex: 0 0 auto;
  width: auto !important;
  min-width: auto !important;
  max-width: none !important;
  padding-left: 8px !important;
  padding-right: 8px !important;
  margin: 0 !important;
}
</style>
