<template>
  <el-select
    v-model="innerValue"
    filterable
    :filter-method="filterMethod"
    clearable
    :multiple="multiple"
    :collapse-tags="multiple"
    :collapse-tags-tooltip="multiple"
    :placeholder="placeholder || (multiple ? '材料类别多选' : '材料类别编码/名称/拼音搜索')"
    :disabled="value2"
  >
    <el-option
      v-for="item in materialCategoryOptions"
      :key="item.materialCategoryId"
      :label="buildOptionLabel(item)"
      :value="item.materialCategoryId"
    />
  </el-select>
</template>

<script>
import { listMaterialCategoryAll } from "@/api/foundation/materialCategory";
import { pinyin } from "pinyin-pro";

export default {
  props: {
    value: {
      type: [String, Number, Array],
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
      materialCategoryOptions: [],
      allMaterialCategoryOptions: []
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
      listMaterialCategoryAll().then(response => {
        const rows = response || [];
        this.allMaterialCategoryOptions = rows;
        this.materialCategoryOptions = rows;
      });
    },
    filterMethod(query) {
      if (!query) {
        this.materialCategoryOptions = this.allMaterialCategoryOptions;
        return;
      }
      const q = query.trim().toUpperCase();
      this.materialCategoryOptions = this.allMaterialCategoryOptions.filter(item => {
        const code = String(item.materialCategoryCode || "").toUpperCase();
        const name = String(item.materialCategoryName || "").toUpperCase();
        const py = this.getPinyinInitials(item.materialCategoryName || "");
        const fullPy = this.getPinyinFull(item.materialCategoryName || "");
        const pinyinCode = String(item.pinyinCode || "").toUpperCase();
        return code.includes(q) || name.includes(q) || py.includes(q) || fullPy.includes(q) || pinyinCode.includes(q);
      });
    },
    buildOptionLabel(item) {
      const code = item.materialCategoryCode || "";
      const name = item.materialCategoryName || "";
      const pinyinCode = item.pinyinCode || "";
      const parts = [code, name, pinyinCode].filter(Boolean);
      return parts.length ? parts.join(" / ") : "";
    },
    getPinyinInitials(str) {
      try {
        return pinyin(str || "", { pattern: "first", toneType: "none", type: "array" }).join("").toUpperCase();
      } catch (e) {
        return "";
      }
    },
    getPinyinFull(str) {
      try {
        return pinyin(str || "", { toneType: "none", type: "array" }).join("").toUpperCase();
      } catch (e) {
        return "";
      }
    }
  }
};
</script>
