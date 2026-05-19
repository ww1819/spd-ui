<template>
  <el-select
    v-model="innerValue"
    size="small"
    filterable
    :filter-method="filterMethod"
    clearable
    :multiple="multiple"
    :collapse-tags="multiple"
    :collapse-tags-tooltip="multiple"
    :placeholder="placeholder || (multiple ? '库房分类多选' : '库房分类编码/名称/简码搜索')"
    :disabled="value2"
  >
    <el-option
      v-for="item in warehouseCategoryOptions"
      :key="item.warehouseCategoryId"
      :label="item.warehouseCategoryName"
      :value="item.warehouseCategoryId"
    />
  </el-select>
</template>

<script>
import { listWarehouseCategoryAll } from "@/api/foundation/warehouseCategory";
import { pinyin } from "pinyin-pro";

export default {
  props: {
    value: {
      type: [Number, String, Array],
      default: null
    },
    value2: {
      type: Boolean,
      default: false
    },
    placeholder: {
      type: String,
      default: ""
    },
    multiple: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      warehouseCategoryOptions: [],
      allWarehouseCategoryOptions: []
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
    filterMethod(query) {
      if (!query) {
        this.warehouseCategoryOptions = this.allWarehouseCategoryOptions;
        return;
      }
      const q = query.trim().toUpperCase();
      this.warehouseCategoryOptions = this.allWarehouseCategoryOptions.filter(item => {
        const code = String(item.warehouseCategoryCode || item.code || "").toUpperCase();
        const name = String(item.warehouseCategoryName || item.name || "").toUpperCase();
        const referred = String(item.referredName || "").toUpperCase();
        const py = this.getPinyinInitials(item.warehouseCategoryName || item.name || "");
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
