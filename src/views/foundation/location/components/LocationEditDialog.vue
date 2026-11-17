<template>
    <div v-if="open" class="page-drawer-mask" @click.self="cancel">
      <div class="page-drawer-panel" @click.stop>
        <div class="page-drawer-header">
          <span class="page-drawer-title">{{ title }}</span>
          <i class="el-icon-close page-drawer-close" @click="cancel" />
        </div>
        <div class="page-drawer-body">
          <el-form ref="form" :model="form" :rules="rules" label-width="100px" size="small" class="location-drawer-form">
            <el-row :gutter="12">
              <el-col :span="12">
                <el-form-item label="货位编码" prop="locationCode">
                  <el-input v-model="form.locationCode" class="location-drawer-control" :disabled="isDisabled" placeholder="货位编码" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="货位名称" prop="locationName">
                  <el-input v-model="form.locationName" class="location-drawer-control" placeholder="货位名称" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="12">
              <el-col :span="12">
                <el-form-item label="选择仓库" prop="warehouseId">
                  <SelectWarehouse v-model="form.warehouseId" class="location-drawer-control" placeholder="仓库" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="选择上级货位" prop="parentId">
                  <el-select v-model="form.parentId" class="location-drawer-control" placeholder="上级货位" clearable>
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
            <el-row :gutter="12">
              <el-col :span="12">
                <el-form-item label="五区类型" prop="zoneType">
                  <el-select v-model="form.zoneType" class="location-drawer-control" placeholder="五区" clearable>
                    <el-option v-for="z in zoneOptions" :key="z.value" :label="z.label" :value="z.value" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="货架编码" prop="shelfCode">
                  <el-input v-model="form.shelfCode" class="location-drawer-control" placeholder="如 A01" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="12">
              <el-col :span="12">
                <el-form-item label="层号" prop="layerNo">
                  <el-input-number v-model="form.layerNo" class="location-drawer-control" :min="1" :max="99" controls-position="right" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="格口号" prop="slotNo">
                  <el-input-number v-model="form.slotNo" class="location-drawer-control" :min="1" :max="99" controls-position="right" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="12">
              <el-col :span="12">
                <el-form-item label="容量" prop="capacity">
                  <el-input-number v-model="form.capacity" class="location-drawer-control" :min="0" :precision="2" controls-position="right" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="组织机构ID">
                  <el-input v-model="form.tenantId" class="location-drawer-control" disabled placeholder="保存后由系统写入" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="12">
              <el-col :span="12">
                <el-form-item label="坐标X(米)" prop="posX">
                  <el-input-number v-model="form.posX" class="location-drawer-control" :precision="2" :step="0.5" controls-position="right" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="坐标Y(米)" prop="posY">
                  <el-input-number v-model="form.posY" class="location-drawer-control" :precision="2" :step="0.5" controls-position="right" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="12">
              <el-col :span="12">
                <el-form-item label="坐标Z(米)" prop="posZ">
                  <el-input-number v-model="form.posZ" class="location-drawer-control" :precision="2" :step="0.1" controls-position="right" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="可选" />
            </el-form-item>
          </el-form>
        </div>
        <div class="page-drawer-footer">
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
