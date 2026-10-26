<template>
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="工作组名称" prop="postName">
          <el-input v-model="form.postName" placeholder="工作组名称" />
        </el-form-item>
        <el-form-item label="工作组编码" prop="postCode">
          <el-input v-model="form.postCode" placeholder="编码名称" />
        </el-form-item>
        <el-form-item label="工作组排序" prop="postSort">
          <el-input-number v-model="form.postSort" controls-position="right" :min="0" />
        </el-form-item>
        <el-form-item label="工作组状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio
              v-for="dict in dict.type.sys_normal_disable"
              :key="dict.value"
              :label="dict.value"
            >{{dict.label}}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="内容" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" class="spd-btn spd-btn--primary" @click="submitForm">确 定</el-button>
        <el-button class="spd-btn spd-btn--secondary" @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'PostEditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'Post')],
  dicts: ['sys_normal_disable'],
  inheritAttrs: false
}
</script>
