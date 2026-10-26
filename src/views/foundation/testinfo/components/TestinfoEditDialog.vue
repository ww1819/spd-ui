<template>
      <el-dialog :title="title" :visible.sync="open" width="1200px" append-to-body>
        <el-form ref="form" :model="form" :rules="rules" label-width="80px">
          <el-row>
            <el-col :span="6">
              <el-form-item label="产品编码" prop="code" label-width="100px">
                <el-input v-model="form.code" :disabled="isDisabled" placeholder="产品编码" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="产品名称" prop="name" label-width="100px">
                <el-input v-model="form.name" @input="nameChange" placeholder="产品名称" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="名称简码" prop="referredName" label-width="100px">
                <el-input v-model="form.referredName" :disabled="true" placeholder="名称简码" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="供应商" prop="supplierId">
                <SelectSupplier v-model="form.supplierId" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row>
            <el-col :span="6">
              <el-form-item label="规格" prop="speci" label-width="100px">
                <el-input v-model="form.speci" placeholder="规格" />
              </el-form-item>
            </el-col>

            <el-col :span="6">
              <el-form-item label="型号" prop="model" label-width="100px">
                <el-input v-model="form.model" placeholder="型号" />
              </el-form-item>
            </el-col>

            <el-col :span="6">
              <el-form-item label="价格" prop="price" label-width="100px">
                <el-input v-model="form.price" placeholder="价格" />
              </el-form-item>
            </el-col>

            <el-col :span="6">
              <el-form-item label="通用名称" prop="useName" label-width="100px">
                <el-input v-model="form.useName" placeholder="通用名称" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row>
            <el-col :span="6">
              <el-form-item label="生产厂家" prop="factoryId" label-width="100px">
                <SelectFactory v-model="form.factoryId"/>
              </el-form-item>
            </el-col>

            <el-col :span="6">
              <el-form-item label="库房分类" prop="storeroomId" label-width="100px">
                <SelectWarehouseCategory v-model="form.storeroomId"/>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="财务分类" prop="financeCategoryId" label-width="100px">
                <SelectFinanceCategory v-model="form.financeCategoryId"/>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="单位" prop="unitId" label-width="100px">
                <SelectUnit v-model="form.unitId" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row>
            <el-col :span="6">
              <el-form-item label="注册证名称" prop="registerName" label-width="100px">
                <el-input v-model="form.registerName" placeholder="注册证名称" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="注册证号" prop="registerNo" label-width="100px">
                <el-input v-model="form.registerNo" placeholder="注册证号" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="医保名称" prop="medicalName" label-width="100px">
                <el-input v-model="form.medicalName" placeholder="医保名称" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="医保编码" prop="medicalNo" label-width="100px">
                <el-input v-model="form.medicalNo" placeholder="医保编码" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row>
            <el-col :span="6">
              <el-form-item label="有效期" prop="periodDate" label-width="100px">
                <el-date-picker clearable
                                v-model="form.periodDate"
                                type="date"
                                value-format="yyyy-MM-dd"
                                style="width: 150px"
                                placeholder="请选择有效期">
                </el-date-picker>
              </el-form-item>
            </el-col>

            <el-col :span="6">
              <el-form-item label="招标类别" prop="successfulType" label-width="100px">
                <el-input v-model="form.successfulType" placeholder="招标类别" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="中标号" prop="successfulNo" label-width="100px">
                <el-input v-model="form.successfulNo" placeholder="中标号" />
              </el-form-item>
            </el-col>

            <el-col :span="6">
              <el-form-item label="中标价格" prop="successfulPrice" label-width="100px">
                <el-input v-model="form.successfulPrice" placeholder="中标价格" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row>
            <el-col :span="6">
              <el-form-item label="销售价" prop="salePrice" label-width="100px">
                <el-input v-model="form.salePrice" placeholder="销售价" />
              </el-form-item>
            </el-col>

            <el-col :span="6">
              <el-form-item label="包装规格" prop="packageSpeci" label-width="100px">
                <el-input v-model="form.packageSpeci" placeholder="包装规格" />
              </el-form-item>
            </el-col>

            <el-col :span="6">
              <el-form-item label=" 产地" prop="producer" label-width="100px">
                <el-input v-model="form.producer" placeholder=" 产地" />
              </el-form-item>
            </el-col>

            <el-col :span="6">
              <el-form-item label=" 耗材级别" label-width="100px">
                <el-select v-model="form.materialLevel" placeholder="请选择耗材级别">
                  <el-option
                    v-for="dict in dict.type.material_level_status"
                    :key="dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row>
            <el-col :span="6">
              <el-form-item label=" 注册证级别" label-width="100px">
                <el-select v-model="form.registerLevel" placeholder="请选择注册证级别">
                  <el-option
                    v-for="dict in dict.type.register_level_status"
                    :key="dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label=" 风险级别" label-width="100px">
                <el-select v-model="form.riskLevel" placeholder="请选择风险级别">
                  <el-option
                    v-for="dict in dict.type.risk_level_status"
                    :key="dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>

            <el-col :span="6">
              <el-form-item label=" 急救类型" prop="firstaidLevel" label-width="100px">
                <el-select v-model="form.firstaidLevel" placeholder="请选择急救类型">
                  <el-option
                    v-for="dict in dict.type.firstaid_level_status"
                    :key="dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>

            <el-col :span="6">
              <el-form-item label=" 医用级别" prop="doctorLevel" label-width="100px">
                <el-select v-model="form.doctorLevel" placeholder="请选择医用级别">
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

          <el-row>
            <el-col :span="6">
              <el-form-item label="品牌" prop="brand" label-width="100px">
                <el-input v-model="form.brand" placeholder="品牌" />
              </el-form-item>
            </el-col>

            <el-col :span="6">
              <el-form-item label="用途" prop="useto" label-width="100px">
                <el-input v-model="form.useto" placeholder="用途" />
              </el-form-item>
            </el-col>

            <el-col :span="6">
              <el-form-item label="材质" prop="quality" label-width="100px">
                <el-input v-model="form.quality" placeholder="材质" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="功能" prop="function" label-width="100px">
                <el-input v-model="form.function" placeholder="功能" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row>
            <el-col :span="6">
              <el-form-item label="储存方式" prop="isWay" label-width="100px">
                <el-select v-model="form.isWay" placeholder="请选择储存方式">
                  <el-option
                    v-for="dict in dict.type.way_status"
                    :key="dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>

            <el-col :span="6">
              <el-form-item label="UDI码" prop="udiNo" label-width="100px">
                <el-input v-model="form.udiNo" placeholder="UDI码" />
              </el-form-item>
            </el-col>

            <el-col :span="6">
              <el-form-item label="许可证编号" prop="permitNo" label-width="100px">
                <el-input v-model="form.permitNo" placeholder="许可证编号" />
              </el-form-item>
            </el-col>

            <el-col :span="6">
              <el-form-item label="国家编码" prop="countryNo" label-width="100px">
                <el-input v-model="form.countryNo" placeholder="国家编码" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row>
            <el-col :span="6">
              <el-form-item label="国家医保名称" prop="countryName" label-width="100px">
                <el-input v-model="form.countryName" placeholder="国家医保名称" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="商品说明" prop="description" label-width="100px">
                <el-input v-model="form.description" placeholder="商品说明" />
              </el-form-item>
            </el-col>

            <el-col :span="6">
              <el-form-item label="使用状态" prop="isUse" label-width="100px">
                <el-select v-model="form.isUse" placeholder="请选择使用状态">
                  <el-option
                    v-for="dict in dict.type.is_use_status"
                    :key="dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>

            <el-col :span="6">
              <el-form-item label="带量采购" prop="isProcure" label-width="100px">
                <el-select v-model="form.isProcure" placeholder="请选择带量采购">
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

          <el-row>
            <el-col :span="6">
              <el-form-item label="重点监测" prop="isMonitor" label-width="100px">
                <el-select v-model="form.isMonitor" placeholder="请选择重点监测">
                  <el-option
                    v-for="dict in dict.type.is_yes_no"
                    :key="dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>

            <el-col :span="6">
              <el-form-item label="是否高值" prop="isGz" label-width="100px">
                <el-select v-model="form.isGz" placeholder="请选择是否高值">
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
        <div slot="footer" class="dialog-footer">
          <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="submitForm">确 定</el-button>
          <el-button size="small" class="spd-btn spd-btn--secondary" @click="cancel">取 消</el-button>
        </div>
      </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'
import SelectSupplier from '@/components/SelectModel/SelectSupplier'
import SelectFactory from '@/components/SelectModel/SelectFactory'
import SelectFinanceCategory from '@/components/SelectModel/SelectFinanceCategory'
import SelectWarehouseCategory from '@/components/SelectModel/SelectWarehouseCategory'
import SelectUnit from '@/components/SelectModel/SelectUnit'

export default {
  name: 'TestinfoEditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'Material' && vm.moreSearchStorageKey === 'spd.foundation.testinfo.moreSearchTypes')],
  components: { SelectSupplier, SelectFactory, SelectFinanceCategory, SelectWarehouseCategory, SelectUnit },
  dicts: ['is_use_status', 'is_yes_no', 'way_status', 'material_level_status', 'register_level_status', 'risk_level_status', 'firstaid_level_status', 'doctor_level_status'],
  inheritAttrs: false
}
</script>
