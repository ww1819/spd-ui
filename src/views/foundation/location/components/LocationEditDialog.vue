<template>
    <div v-if="open" class="local-modal-mask">
      <div class="local-modal-content">
        <div style="font-size:18px;font-weight:bold;margin-bottom:16px;">{{ title }}</div>
        <el-form ref="form" :model="form" :rules="rules" label-width="120px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="货位编码" prop="locationCode">
                <el-input v-model="form.locationCode" :disabled="isDisabled" placeholder="货位编码" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="货位名称" prop="locationName">
                <el-input v-model="form.locationName" placeholder="货位名称" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="选择仓库" prop="warehouseId">
                <SelectWarehouse v-model="form.warehouseId" placeholder="仓库" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="选择上级货位" prop="parentId">
                <el-select v-model="form.parentId" placeholder="上级货位" clearable style="width: 100%">
                  <el-option
                    v-for="item in parentOptions"
                    :key="item.locationId"
                    :label="item.locationName"
                    :value="item.locationId"
                    :disabled="form.locationId && item.locationId === form.locationId"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="五区类型" prop="zoneType">
                <el-select v-model="form.zoneType" placeholder="五区" clearable style="width: 100%">
                  <el-option v-for="z in zoneOptions" :key="z.value" :label="z.label" :value="z.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="货架编码" prop="shelfCode">
                <el-input v-model="form.shelfCode" placeholder="如 A01" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="层号" prop="layerNo">
                <el-input-number v-model="form.layerNo" :min="1" :max="99" controls-position="right" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="格口号" prop="slotNo">
                <el-input-number v-model="form.slotNo" :min="1" :max="99" controls-position="right" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="容量" prop="capacity">
                <el-input-number v-model="form.capacity" :min="0" :precision="2" controls-position="right" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="坐标X(米)" prop="posX">
                <el-input-number v-model="form.posX" :precision="2" :step="0.5" controls-position="right" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="坐标Y(米)" prop="posY">
                <el-input-number v-model="form.posY" :precision="2" :step="0.5" controls-position="right" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="坐标Z(米)" prop="posZ">
                <el-input-number v-model="form.posZ" :precision="2" :step="0.1" controls-position="right" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="组织机构ID">
                <el-input v-model="form.tenantId" disabled placeholder="保存后由系统写入" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="备注" prop="remark">
                <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="可选" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
        <div class="dialog-footer" style="text-align:right;margin-top:16px;">
          <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="submitForm">确 定</el-button>
          <el-button size="small" class="spd-btn spd-btn--secondary" @click="cancel">取 消</el-button>
        </div>
      </div>
    </div>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse'

export default {
  name: 'LocationEditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'Location')],
  components: { SelectWarehouse },
  inheritAttrs: false
}
</script>
