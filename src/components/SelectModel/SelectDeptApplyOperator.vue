<template>
  <el-select
    v-model="user"
    filterable
    clearable
    :loading="loading"
    placeholder="请选择操作人"
  >
    <el-option
      v-for="item in userOptions"
      :key="item.userId"
      :label="item.nickName || item.userName"
      :value="item.userId"
    />
  </el-select>
</template>

<script>
import { listDeptApplyOperatorOptions } from '@/api/department/apply';

export default {
  name: 'SelectDeptApplyOperator',
  props: {
    value: [String, Number],
    departmentId: [String, Number]
  },
  data() {
    return {
      userOptions: [],
      loading: false
    };
  },
  computed: {
    user: {
      get() {
        return this.value;
      },
      set(v) {
        this.$emit('input', v);
      }
    }
  },
  watch: {
    departmentId: {
      handler() {
        this.fetchOptions();
      },
      immediate: true
    }
  },
  methods: {
    fetchOptions() {
      this.loading = true;
      listDeptApplyOperatorOptions(this.departmentId)
        .then(res => {
          const list = (res && res.data) != null ? res.data : [];
          this.userOptions = Array.isArray(list) ? list : [];
          this.syncValueWithOptions();
        })
        .finally(() => {
          this.loading = false;
        });
    },
    syncValueWithOptions() {
      const v = this.value;
      if (v === null || v === undefined || v === '') {
        return;
      }
      const ok = this.userOptions.some(
        u => u.userId === v || String(u.userId) === String(v)
      );
      if (!ok) {
        this.$emit('input', null);
      }
    }
  }
};
</script>
