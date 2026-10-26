<template>
    <el-dialog
      :visible.sync="hisDialogVisible"
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
        <span>HIS对照</span>
        <el-button type="text" @click="hisDialogVisible = false" style="padding: 0;">关闭</el-button>
      </div>
      <div class="his-current-material-box">
        <div class="his-current-material-title">产品档案基本信息</div>
        <div class="his-current-material-grid">
          <div class="his-current-material-item"><span class="label">产品编码：</span><span class="value">{{ (currentMaterialRow && currentMaterialRow.code) || '--' }}</span></div>
          <div class="his-current-material-item"><span class="label">产品名称：</span><span class="value">{{ (currentMaterialRow && currentMaterialRow.name) || '--' }}</span></div>
          <div class="his-current-material-item"><span class="label">规格：</span><span class="value">{{ (currentMaterialRow && currentMaterialRow.speci) || '--' }}</span></div>
          <div class="his-current-material-item"><span class="label">型号：</span><span class="value">{{ (currentMaterialRow && currentMaterialRow.model) || '--' }}</span></div>
          <div class="his-current-material-item"><span class="label">单位：</span><span class="value">{{ (currentMaterialRow && currentMaterialRow.fdUnit && currentMaterialRow.fdUnit.unitName) || (currentMaterialRow && currentMaterialRow.unitName) || '--' }}</span></div>
          <div class="his-current-material-item"><span class="label">价格：</span><span class="value">{{ formatCurrency(currentMaterialRow && currentMaterialRow.price) }}</span></div>
          <div class="his-current-material-item"><span class="label">供应商：</span><span class="value">{{ (currentMaterialRow && currentMaterialRow.supplier && currentMaterialRow.supplier.name) || (currentMaterialRow && currentMaterialRow.supplierName) || '--' }}</span></div>
          <div class="his-current-material-item"><span class="label">生产厂家：</span><span class="value">{{ (currentMaterialRow && currentMaterialRow.fdFactory && currentMaterialRow.fdFactory.factoryName) || (currentMaterialRow && currentMaterialRow.factoryName) || '--' }}</span></div>
        </div>
        <div class="his-current-material-title his-current-material-subtitle">对照收费项目</div>
        <div class="his-current-material-grid">
          <div class="his-current-material-item"><span class="label">收费编码：</span><span class="value">{{ (currentHisChargeItem && currentHisChargeItem.chargeCode) || (currentMaterialRow && currentMaterialRow.hisCode) || (currentMaterialRow && currentMaterialRow.hisChargeItemId) || '--' }}</span></div>
          <div class="his-current-material-item"><span class="label">收费名称：</span><span class="value">{{ (currentHisChargeItem && currentHisChargeItem.chargeName) || '--' }}</span></div>
          <div class="his-current-material-item"><span class="label">收费规格：</span><span class="value">{{ (currentHisChargeItem && currentHisChargeItem.chargeSpeci) || '--' }}</span></div>
          <div class="his-current-material-item"><span class="label">收费型号：</span><span class="value">{{ (currentHisChargeItem && currentHisChargeItem.chargeModel) || '--' }}</span></div>
          <div class="his-current-material-item"><span class="label">收费单价：</span><span class="value">{{ currentHisChargeItem && currentHisChargeItem.chargePrice != null ? formatCurrency(currentHisChargeItem.chargePrice) : '--' }}</span></div>
        </div>
      </div>
      
      <!-- 搜索框 -->
      <div class="his-query-container">
        <el-form :model="hisQueryParams" ref="hisQueryForm" size="small" :inline="true" label-width="80px">
          <el-row>
            <el-col :span="24">
              <el-form-item label="项目编码" prop="itemCode" class="query-item-inline">
                <el-input
                  v-model="hisQueryParams.itemCode"
                  placeholder="收费编码"
                  clearable
                  @keyup.enter.native="handleHisQuery"
                  style="width: 180px"
                />
              </el-form-item>
              <el-form-item label="名称" prop="name" class="query-item-inline">
                <el-input
                  v-model="hisQueryParams.name"
                  placeholder="收费名称"
                  clearable
                  @keyup.enter.native="handleHisQuery"
                  style="width: 180px"
                />
              </el-form-item>

              <el-form-item label="规格" prop="speci" class="query-item-inline">
                <el-input
                  v-model="hisQueryParams.speci"
                  placeholder="规格"
                  clearable
                  @keyup.enter.native="handleHisQuery"
                  style="width: 200px"
                />
              </el-form-item>
              <el-form-item class="query-item-inline his-query-btn-item" label-width="0">
                <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="handleHisQuery">搜索</el-button>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <!-- 明细表格：外层 flex 占满剩余高度，仅表体内部滚动，弹窗整体不上下滑动 -->
      <div class="his-table-container material-compare-dialog-table-wrap">
        <div class="material-compare-dialog-table-scroll">
          <el-table
            v-loading="hisLoading"
            :data="hisList"
            class="his-detail-table"
            border
            height="100%"
            :row-class-name="hisDetailRowClassName"
            @row-dblclick="handleHisDetailRowDblclick"
          >
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
          <el-table-column label="状态" align="center" width="100">
            <template slot-scope="scope">
              <el-tag v-if="isBoundHis(scope.row)" type="success" size="mini">已绑定</el-tag>
              <el-tag v-else size="mini">未绑定</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="100" class-name="his-detail-action-col">
            <template slot-scope="scope">
              <el-button v-if="isBoundHis(scope.row)" type="text" size="mini" @click="handleUnbindHis()">解绑</el-button>
              <el-button v-else type="text" size="mini" @click="handleBindHis(scope.row)">绑定</el-button>
            </template>
          </el-table-column>
          </el-table>
        </div>

        <pagination
          v-show="hisTotal > 0"
          :total="hisTotal"
          :page.sync="hisQueryParams.pageNum"
          :limit.sync="hisQueryParams.pageSize"
          @pagination="getHisList"
        />
      </div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'MaterialCompareHisDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'MaterialCompare')],
  inheritAttrs: false
}
</script>

<style>
/* HIS 明细：悬停变色 + 双击选中更深色（与主列表一致）。弹窗已拆出，样式不能留在父页 scoped 里。 */
.material-compare-page .his-detail-table .el-table__body tr > td,
.material-compare-page .his-detail-table .el-table__body tr > td .cell {
  transition: none !important;
}

.material-compare-page .his-detail-table .el-table__body tr:hover > td,
.material-compare-page .his-detail-table .el-table__body tr:hover > td .cell {
  background-color: #D6EBFF !important;
}

.material-compare-page .his-detail-table .el-table__body tr.his-detail-row-selected > td,
.material-compare-page .his-detail-table .el-table__body tr.his-detail-row-selected > td .cell {
  background-color: #B8DAFF !important;
}

.material-compare-page .his-detail-table .el-table__body tr.his-detail-row-selected:hover > td,
.material-compare-page .his-detail-table .el-table__body tr.his-detail-row-selected:hover > td .cell {
  background-color: #A0CBFF !important;
}
</style>
