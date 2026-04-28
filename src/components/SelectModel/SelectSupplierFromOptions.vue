<template>
  <el-select
    v-model="inner"
    popper-class="select-dropdown--multiline"
    filterable
    clearable
    :placeholder="placeholder"
    :disabled="disabled"
    :loading="loading"
    style="width: 100%;"
  >
    <el-option
      v-for="item in normalizedOptions"
      :key="String(item.id)"
      :label="item.name || ''"
      :value="item.id"
    >
      <el-tooltip
        :content="item.name || ''"
        placement="top"
        effect="dark"
        :open-delay="250"
        popper-class="select-model-dropdown-tooltip"
      >
        <span class="select-option-label-wrap">{{ item.name }}</span>
      </el-tooltip>
    </el-option>
  </el-select>
</template>

<script>
/**
 * 供应商下拉：选项由父组件传入，不在此组件内请求接口。
 * 用于采购计划明细等多行场景，全页只加载一次供应商列表。
 */
export default {
  name: "SelectSupplierFromOptions",
  props: {
    value: {},
    /** 与 SelectSupplier 一致：为 true 时禁用 */
    value2: {
      type: Boolean,
      default: false
    },
    /** 供应商列表（含 id、name，可选 code、referredCode） */
    options: {
      type: Array,
      default: () => []
    },
    /** 父级拉取全量列表时的 loading */
    loading: {
      type: Boolean,
      default: false
    },
    placeholder: {
      type: String,
      default: "请选择供应商"
    }
  },
  computed: {
    disabled() {
      return this.value2 === true;
    },
    inner: {
      get() {
        return this.value;
      },
      set(v) {
        this.$emit("input", v);
      }
    },
    normalizedOptions() {
      const arr = this.options || [];
      return arr.filter((x) => x != null && x.id != null && x.id !== "");
    }
  }
};
</script>

<style scoped>
.select-option-label-wrap {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}
</style>
