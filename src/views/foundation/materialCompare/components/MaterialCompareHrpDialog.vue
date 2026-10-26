<template>
    <el-dialog
      :visible.sync="hrpDialogVisible"
      width="100%"
      top="0"
      :append-to-body="false"
      :modal-append-to-body="false"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
      custom-class="material-compare-dialog"
    >
      <div slot="title" style="display: flex; justify-content: space-between; align-items: center;">
        <span>HRP对照</span>
        <el-button type="text" @click="hrpDialogVisible = false" style="padding: 0;">关闭</el-button>
      </div>
      
      <!-- 搜索框 -->
      <div class="hrp-query-container">
        <el-form :model="hrpQueryParams" ref="hrpQueryForm" size="small" :inline="true" label-width="80px">
          <el-row>
            <el-col :span="24">
              <el-form-item label="名称" prop="name" class="query-item-inline">
                <el-input
                  v-model="hrpQueryParams.name"
                  placeholder="名称"
                  clearable
                  @keyup.enter.native="handleHrpQuery"
                  style="width: 200px"
                />
              </el-form-item>

              <el-form-item label="规格" prop="speci" class="query-item-inline">
                <el-input
                  v-model="hrpQueryParams.speci"
                  placeholder="规格"
                  clearable
                  @keyup.enter.native="handleHrpQuery"
                  style="width: 200px"
                />
              </el-form-item>
              <el-form-item class="query-item-inline" label-width="0">
                <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="handleHrpQuery">搜索</el-button>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <!-- 明细表格 -->
      <div class="hrp-table-container material-compare-dialog-table-wrap">
        <div class="material-compare-dialog-table-scroll">
          <el-table v-loading="hrpLoading" :data="hrpList" border height="100%">
          <el-table-column type="index" label="序号" align="center" width="80" />
          <el-table-column label="收费编码" align="center" prop="chargeCode" width="150" show-overflow-tooltip />
          <el-table-column label="收费名称" align="center" prop="chargeName" min-width="200" show-overflow-tooltip />
          <el-table-column label="收费规格" align="center" prop="chargeSpeci" width="150" show-overflow-tooltip />
          <el-table-column label="收费型号" align="center" prop="chargeModel" width="150" show-overflow-tooltip />
          <el-table-column label="收费单价" align="center" prop="chargePrice" width="120">
            <template slot-scope="scope">
              <span>{{ formatCurrency(scope.row.chargePrice) }}</span>
            </template>
          </el-table-column>
          </el-table>
        </div>

        <pagination
          v-show="hrpTotal > 0"
          :total="hrpTotal"
          :page.sync="hrpQueryParams.pageNum"
          :limit.sync="hrpQueryParams.pageSize"
          @pagination="getHrpList"
        />
      </div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'MaterialCompareHrpDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'MaterialCompare')],
  inheritAttrs: false
}
</script>
