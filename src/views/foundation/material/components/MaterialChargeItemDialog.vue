<template>
    <el-dialog
      title="收费项目维护"
      :visible.sync="chargeItemDialog.visible"
      width="86%"
      top="5vh"
      append-to-body
    >
      <el-form :model="chargeItemDialog.query" size="small" :inline="true">
        <el-form-item label="收费项ID">
          <el-input v-model="chargeItemDialog.query.chargeItemId" placeholder="收费项ID" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item label="收费编码">
          <el-input v-model="chargeItemDialog.query.itemCode" placeholder="收费编码" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item label="收费名称">
          <el-input v-model="chargeItemDialog.query.name" placeholder="收费名称" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="规格">
          <el-input v-model="chargeItemDialog.query.speci" placeholder="规格" clearable style="width: 120px" />
        </el-form-item>
        <el-form-item label="高低值">
          <el-select v-model="chargeItemDialog.query.valueLevel" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="opt in chargeItemValueLevelOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleChargeItemQuery">查询</el-button>
          <el-button @click="resetChargeItemQuery">重置</el-button>
          <el-button
            type="success"
            :loading="chargeItemDialog.fetching"
            @click="handleFetchChargeItem"
            v-hasPermi="['foundation:chargeItem:fetch','foundation:material:query']"
          >抓取收费项目</el-button>
          <el-button
            type="warning"
            :loading="chargeItemDialog.exporting"
            @click="handleExportChargeItem"
            v-hasPermi="['foundation:chargeItem:export','foundation:material:export']"
          >下载</el-button>
        </el-form-item>
      </el-form>

      <el-row :gutter="10" class="mb8">
        <el-col :span="1.5">
          <span class="charge-item-batch-hint">
            已选 {{ chargeItemCrossPageSelectedCount }} 条<span v-if="chargeItemCrossPageSelectedCount > 0">（含跨页）</span>
          </span>
        </el-col>
        <el-col :span="1.5">
          <el-select
            v-model="chargeItemDialog.batchValueLevel"
            placeholder="批量高低值"
            size="small"
            clearable
            style="width: 120px"
          >
            <el-option v-for="opt in chargeItemValueLevelOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-col>
        <el-col :span="1.5">
          <el-button
            type="primary"
            size="small"
            :loading="chargeItemDialog.batchSaving"
            :disabled="chargeItemCrossPageSelectedCount === 0"
            v-hasPermi="['foundation:chargeItem:edit','foundation:material:edit']"
            @click="handleChargeItemBatchSave"
          >批量设置</el-button>
        </el-col>
        <el-col :span="1.5" v-if="chargeItemCrossPageSelectedCount > 0">
          <el-button type="text" size="small" @click="clearChargeItemCrossPageSelection">清空已选</el-button>
        </el-col>
      </el-row>

      <el-table
        ref="chargeItemTable"
        v-loading="chargeItemDialog.loading"
        :data="chargeItemDialog.list"
        :row-key="getChargeItemRowKey"
        border
        stripe
        max-height="58vh"
        @selection-change="handleChargeItemSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" fixed="left" :reserve-selection="true" />
        <el-table-column label="收费项ID" prop="chargeItemId" width="140" show-overflow-tooltip />
        <el-table-column label="收费编码" prop="chargeCode" width="130" show-overflow-tooltip />
        <el-table-column label="收费名称" prop="chargeName" min-width="180" show-overflow-tooltip />
        <el-table-column label="规格型号" prop="chargeSpeci" min-width="120" show-overflow-tooltip />
        <el-table-column label="单价" prop="chargePrice" width="100" />
        <el-table-column label="拼音简码" prop="referredCode" width="120" />
        <el-table-column label="高低值属性" width="190">
          <template slot-scope="scope">
            <el-select
              v-model="scope.row.valueLevel"
              size="mini"
              style="width: 110px; margin-right: 8px;"
              :disabled="scope.row._saving"
            >
              <el-option v-for="opt in chargeItemValueLevelOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
            <el-button
              type="text"
              size="mini"
              :disabled="scope.row._saving"
              @click="saveChargeItemValueLevel(scope.row)"
              v-hasPermi="['foundation:chargeItem:edit','foundation:material:edit']"
            >保存</el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination
        v-show="chargeItemDialog.total > 0"
        :total="chargeItemDialog.total"
        :page.sync="chargeItemDialog.query.pageNum"
        :limit.sync="chargeItemDialog.query.pageSize"
        @pagination="loadChargeItemList"
      />
    </el-dialog>
</template>

<script>
import hostProxyMixin from './hostProxyMixin'

export default {
  name: 'MaterialChargeItemDialog',
  mixins: [hostProxyMixin],
  inheritAttrs: false,
  mounted() {
    this.syncRefsToParent()
    this.loadChargeItemList()
  }
}
</script>
