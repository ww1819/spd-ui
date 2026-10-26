<template>
    <!-- 引用单据弹窗：根据单据类型显示对应业务单列表，关闭按钮为汉字「关闭」 -->
    <el-dialog
      title="引用单据"
      :visible.sync="refBillDialogVisible"
      width="800px"
      append-to-body
      :show-close="false"
      :show-footer="false"
      @open="loadRefBillList"
      @close="refBillList = []; refBillSearchNo = ''"
    >
      <span slot="title" class="ref-bill-dialog-title">
        <span>引用单据</span>
        <el-button type="text" icon="el-icon-close" class="ref-bill-dialog-close" @click="refBillDialogVisible = false">关闭</el-button>
      </span>
      <div v-loading="refBillLoading" class="ref-bill-content">
        <p v-if="refBillTypeName" class="ref-bill-tip">当前单据类型：{{ refBillTypeName }}</p>
        <div class="ref-bill-search">
          <el-input
            v-model="refBillSearchNo"
            placeholder="单号模糊检索（不区分大小写）"
            clearable
            size="small"
            style="width: 260px; margin-bottom: 12px;"
            prefix-icon="el-icon-search"
          />
        </div>
        <el-table v-if="refBillListFiltered.length" :data="refBillListFiltered" border max-height="400" size="small">
          <el-table-column type="index" label="序号" width="55" align="center" />
          <el-table-column prop="billNo" label="单号" min-width="120" show-overflow-tooltip />
          <el-table-column label="仓库" min-width="100" show-overflow-tooltip>
            <template slot-scope="scope">
              {{ (scope.row.warehouse && scope.row.warehouse.name) || scope.row.warehouseName || '—' }}
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="制单时间" width="160" show-overflow-tooltip />
          <el-table-column label="操作" width="80" align="center" fixed="right">
            <template slot-scope="scope">
              <el-button type="text" size="mini" @click="selectRefBill(scope.row)">引用</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else-if="!refBillLoading" :description="refBillSearchNo ? '无匹配单号' : '暂无数据'" />
      </div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'PrintSettingRefBillDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'PrintSettingForm')],
  inheritAttrs: false
}
</script>
