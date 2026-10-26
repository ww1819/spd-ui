<template>
    <el-dialog title="推送/应用字段配置" :visible.sync="fieldCfgVisible" width="720px" append-to-body destroy-on-close>
      <el-table v-loading="fieldCfgLoading" :data="fieldCfgRows" border size="small" max-height="420">
        <el-table-column prop="fieldCode" label="字段编码" width="140" />
        <el-table-column prop="fieldLabel" label="显示名" width="120" />
        <el-table-column label="推送" width="80" align="center">
          <template slot-scope="scope">
            <el-switch v-model="scope.row.pushEnabled" active-value="1" inactive-value="0" />
          </template>
        </el-table-column>
        <el-table-column label="允许应用" width="90" align="center">
          <template slot-scope="scope">
            <el-switch v-model="scope.row.applyEnabled" active-value="1" inactive-value="0" />
          </template>
        </el-table-column>
        <el-table-column prop="sortNo" label="排序" width="70" align="center" />
      </el-table>
      <div slot="footer" class="dialog-footer">
        <el-button @click="fieldCfgVisible = false">取消</el-button>
        <el-button type="primary" v-hasPermi="['foundation:scmMaterial:config']" @click="saveFieldCfg">保存</el-button>
      </div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'ScmMaterialArchiveFieldDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'FoundationScmMaterialArchive')],
  inheritAttrs: false
}
</script>
