<template>
    <div v-if="open" class="local-modal-mask">
      <div class="local-modal-content">
        <div style="font-size:18px;font-weight:bold;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;">
          <span>{{ title }}</span>
          <el-button type="text" @click="cancel" style="font-size:14px;padding:0;color:#909399;">关闭</el-button>
        </div>
        <el-form ref="form" :model="form" :rules="rules" label-width="100px">
          <el-row>
            <el-col :span="6">
              <el-form-item label="供应商编码" prop="code">
                <el-input v-model="form.code" :disabled="isDisabled" placeholder="供应商编码（不填自动生成）" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="供应商名称" prop="name">
                <el-input v-model="form.name" placeholder="请输入供应商名称" @input="supplierNameChange" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="名称简码" prop="referredCode">
                <el-input v-model="form.referredCode" placeholder="可随名称自动生成" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="公司简称" prop="companyReferred">
                <el-input v-model="form.companyReferred" placeholder="公司简称" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row>
            <el-col :span="12">
              <el-form-item label="HIS供应商ID" prop="hisId">
                <el-input
                  v-model="form.hisId"
                  :disabled="!!form.id || !supplierImportRequiresHisId"
                  :placeholder="hisIdPlaceholder"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row>
            <el-col :span="6">
              <el-form-item label="法人" prop="legalPerson">
                <el-input v-model="form.legalPerson" placeholder="法人" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="税号" prop="taxNumber">
                <el-input v-model="form.taxNumber" placeholder="请输入税号" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="资质有效期" prop="validTime">
                <el-date-picker
                  v-model="form.validTime"
                  type="date"
                  placeholder="选择日期"
                  value-format="yyyy-MM-dd"
                  style="width: 100%"
                  clearable
                />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="状态" prop="supplierStatus">
                <el-select v-model="form.supplierStatus" placeholder="状态" clearable style="width: 100%">
                  <el-option
                    v-for="d in dict.type.is_use_status"
                    :key="d.value"
                    :label="d.label"
                    :value="d.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="税号" prop="taxNumber">
                <el-input v-model="form.taxNumber" placeholder="请输入税号" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="资质有效期" prop="validTime">
                <el-date-picker
                  v-model="form.validTime"
                  type="date"
                  placeholder="选择日期"
                  value-format="yyyy-MM-dd"
                  style="width: 100%"
                  clearable
                />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="状态" prop="supplierStatus">
                <el-select v-model="form.supplierStatus" placeholder="状态" clearable style="width: 100%">
                  <el-option
                    v-for="d in dict.type.is_use_status"
                    :key="d.value"
                    :label="d.label"
                    :value="d.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row>
            <el-col :span="6">
              <el-form-item label="证件号" prop="certNumber">
                <el-input v-model="form.certNumber" placeholder="证件号" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="地址" prop="address">
                <el-input v-model="form.address" placeholder="地址" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="注册资金" prop="regMoney">
                <el-input v-model="form.regMoney" placeholder="注册资金" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="银行账号" prop="bankAccount">
                <el-input v-model="form.bankAccount" placeholder="银行账号" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row>
            <el-col :span="6">
              <el-form-item label="联系人" prop="contacts">
                <el-input v-model="form.contacts" placeholder="联系人" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="联系电话" prop="contactsPhone">
                <el-input v-model="form.contactsPhone" placeholder="联系电话" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="网址" prop="website">
                <el-input v-model="form.website" placeholder="网址" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="邮编" prop="zipCode">
                <el-input v-model="form.zipCode" placeholder="邮编" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row>
            <el-col :span="6">
              <el-form-item label="邮箱" prop="email">
                <el-input v-model="form.email" placeholder="邮箱" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="传真" prop="fax">
                <el-input v-model="form.fax" placeholder="传真" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="公司负责人" prop="companyPerson">
                <el-input v-model="form.companyPerson" placeholder="公司负责人" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="税号" prop="taxNumber">
                <el-input v-model="form.taxNumber" placeholder="请输入税号" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row>
            <el-col :span="6">
              <el-form-item label="电话" prop="phone">
                <el-input v-model="form.phone" placeholder="电话" />
              </el-form-item>
            </el-col>
            <el-col :span="18">
              <el-form-item label="经营范围" prop="supplierRange">
                <el-input v-model="form.supplierRange" type="textarea" :rows="2" placeholder="请输入经营范围" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row>
            <el-col :span="24">
              <el-form-item label="备注" prop="remark">
                <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="备注（对应表 remark）" />
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 供应商类型容器 -->
          <el-row>
            <el-col :span="24">
              <div class="supplier-type-container">
                <el-form-item label="供应商类型：" prop="supplierType" label-width="100px">
                  <div class="supplier-type-buttons">
                    <span
                      v-for="type in supplierTypeOptions"
                      :key="type.value"
                      :class="['supplier-type-btn', { 'active': form.supplierTypeList && form.supplierTypeList.includes(type.value) }]"
                      @click="toggleSupplierType(type.value)">
                      {{ type.label }}
                    </span>
                  </div>
                </el-form-item>
              </div>
            </el-col>
          </el-row>
        </el-form>
        <div class="modal-footer-fixed">
          <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="submitForm">保 存</el-button>
          <el-button size="small" class="spd-btn spd-btn--secondary" @click="cancel">取 消</el-button>
        </div>
      </div>
    </div>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'SupplierEditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'Supplier')],
  dicts: ['is_use_status'],
  inheritAttrs: false
}
</script>
