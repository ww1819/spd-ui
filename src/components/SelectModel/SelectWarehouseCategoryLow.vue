<template>
  <el-select
    v-model="innerValue"
    filterable
    :filter-method="filterMethod"
    clearable
    :multiple="multiple"
    collapse-tags
    collapse-tags-tooltip
    :placeholder="placeholder || '库房分类编码/名称/简拼搜索'"
    :disabled="disabled"
  >
    <el-option
      v-for="item in warehouseCategoryOptions"
      :key="item.warehouseCategoryId"
      :label="buildLabel(item)"
      :value="item.warehouseCategoryId"
    />
  </el-select>
</template>

<script>
import { listWarehouseCategoryAll } from "@/api/foundation/warehouseCategory";
import { pinyin } from "pinyin-pro";

export default {
  name: "SelectWarehouseCategoryLow",
  props: {
    value: {
      type: [Number, String, Array],
      default: null
    },
    placeholder: {
      type: String,
      default: ""
    },
    multiple: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      allWarehouseCategoryOptions: [],
      warehouseCategoryOptions: []
    };
  },
  computed: {
    innerValue: {
      get() {
        if (this.multiple) {
          return Array.isArray(this.value) ? this.value : [];
        }
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
    getList() {
      listWarehouseCategoryAll().then(response => {
        this.allWarehouseCategoryOptions = response || [];
        this.warehouseCategoryOptions = this.allWarehouseCategoryOptions;
      });
    },
    buildLabel(item) {
      const code = item.warehouseCategoryCode || "";
      const name = item.warehouseCategoryName || "";
      return code ? `${code} / ${name}` : name;
    },
    filterMethod(query) {
      if (!query) {
        this.warehouseCategoryOptions = this.allWarehouseCategoryOptions;
        return;
      }
      const q = query.trim().toUpperCase();
      this.warehouseCategoryOptions = this.allWarehouseCategoryOptions.filter(item => {
        const code = String(item.warehouseCategoryCode || "").toUpperCase();
        const name = String(item.warehouseCategoryName || "").toUpperCase();
        const referred = String(item.referredName || "").toUpperCase();
        const py = this.getPinyinInitials(item.warehouseCategoryName || "");
        return code.includes(q) || name.includes(q) || referred.includes(q) || py.includes(q);
      });
    },
    getPinyinInitials(str) {
      try {
        return pinyin(str || "", { pattern: "first", toneType: "none", type: "array" }).join("").toUpperCase();
      } catch (e) {
        return "";
      }
    }
  }
};
</script>
