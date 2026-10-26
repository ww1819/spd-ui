<template>
    <el-dialog
      title="批量修改产品档案"
      :visible.sync="batchUpdateDialog.visible"
      width="560px"
      append-to-body
      @close="resetBatchUpdateForm"
    >
      <el-alert
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 16px;"
        :title="'已跨页选中 ' + crossPageSelectedCount + ' 条；当前查询共 ' + (total || 0) + ' 条；留空的项不修改'"
      />
      <el-form ref="batchUpdateForm" :model="batchUpdateDialog.form" label-width="100px" size="small">
        <el-form-item label="库房分类">
          <SelectWarehouseCategory v-model="batchUpdateDialog.form.storeroomId" placeholder="不修改请留空" style="width: 100%"/>
        </el-form-item>
        <el-form-item label="财务分类">
          <SelectFinanceCategory v-model="batchUpdateDialog.form.financeCategoryId" placeholder="不修改请留空" style="width: 100%"/>
        </el-form-item>
        <el-form-item label="材料类别">
          <SelectMaterialCategory v-model="batchUpdateDialog.form.materialCategoryId" placeholder="不修改请留空" style="width: 100%"/>
        </el-form-item>
        <el-form-item label="启用">
          <el-select v-model="batchUpdateDialog.form.isUse" placeholder="不修改" clearable style="width: 100%">
            <el-option v-for="dict in dict.type.is_use_status" :key="dict.value" :label="dict.label" :value="dict.value"/>
          </el-select>
        </el-form-item>
        <el-form-item label="计费">
          <el-select v-model="batchUpdateDialog.form.isBilling" placeholder="不修改" clearable style="width: 100%">
            <el-option v-for="dict in dict.type.is_yes_no" :key="'b'+dict.value" :label="dict.label" :value="dict.value"/>
          </el-select>
        </el-form-item>
        <el-form-item label="高值">
          <el-select v-model="batchUpdateDialog.form.isGz" placeholder="不修改" clearable style="width: 100%">
            <el-option v-for="dict in dict.type.is_yes_no" :key="'g'+dict.value" :label="dict.label" :value="dict.value"/>
          </el-select>
        </el-form-item>
        <el-form-item label="跟台">
          <el-select v-model="batchUpdateDialog.form.isFollow" placeholder="不修改" clearable style="width: 100%">
            <el-option v-for="dict in dict.type.is_yes_no" :key="'f'+dict.value" :label="dict.label" :value="dict.value"/>
          </el-select>
        </el-form-item>
        <el-form-item label="集采">
          <el-select v-model="batchUpdateDialog.form.isProcure" placeholder="不修改" clearable style="width: 100%">
            <el-option v-for="dict in dict.type.is_yes_no" :key="'p'+dict.value" :label="dict.label" :value="dict.value"/>
          </el-select>
        </el-form-item>
        <el-form-item label="集采类型">
          <SelectJcType v-model="batchUpdateDialog.form.jcTypeId" placeholder="不修改请留空" />
        </el-form-item>
        <el-form-item label="阳采">
          <el-select v-model="batchUpdateDialog.form.isSunshineProcurement" placeholder="不修改" clearable style="width: 100%">
            <el-option v-for="dict in dict.type.is_yes_no" :key="'s'+dict.value" :label="dict.label" :value="dict.value"/>
          </el-select>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="batchUpdateDialog.visible = false">取 消</el-button>
        <el-button type="primary" :loading="batchUpdateDialog.loading" @click="submitBatchUpdate">确 定</el-button>
      </span>
    </el-dialog>
</template>

<script>
import hostProxyMixin from './hostProxyMixin'
import SelectFinanceCategory from '@/components/SelectModel/SelectFinanceCategory'
import SelectMaterialCategory from '@/components/SelectModel/SelectMaterialCategory'
import SelectWarehouseCategory from '@/components/SelectModel/SelectWarehouseCategory'
import SelectJcType from '@/components/SelectModel/SelectJcType'

export default {
  name: 'MaterialBatchUpdateDialog',
  mixins: [hostProxyMixin],
  dicts: ['is_use_status', 'is_yes_no'],
  components: { SelectFinanceCategory, SelectMaterialCategory, SelectWarehouseCategory, SelectJcType },
  inheritAttrs: false
}
</script>
