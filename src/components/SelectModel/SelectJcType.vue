<template>
  <el-select
    v-model="selected"
    filterable
    clearable
    :placeholder="placeholder"
    :disabled="disabled"
    style="width: 100%"
  >
    <el-option
      v-for="item in options"
      :key="item.id"
      :label="formatLabel(item)"
      :value="item.id"
    />
  </el-select>
</template>

<script>
import { listJcTypeAll } from "@/api/foundation/jcType";

export default {
  name: "SelectJcType",
  props: {
    value: {},
    disabled: {
      type: Boolean,
      default: false
    },
    placeholder: {
      type: String,
      default: "请选择集采类型"
    },
    /** 仅加载在用类型 */
    onlyInUse: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      options: []
    };
  },
  computed: {
    selected: {
      get() {
        return this.value;
      },
      set(v) {
        this.$emit("input", v);
      }
    }
  },
  created() {
    this.getList();
  },
  methods: {
    formatLabel(item) {
      if (!item) return "";
      if (item.code) return item.code + " - " + item.name;
      return item.name;
    },
    getList() {
      const query = this.onlyInUse ? { isUse: "1" } : {};
      listJcTypeAll(query).then(response => {
        this.options = response || [];
      });
    }
  }
};
</script>
