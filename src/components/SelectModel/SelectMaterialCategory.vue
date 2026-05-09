<template>
  <el-select
    v-model="materialCategory"
    filterable
    :filter-method="filterMethod"
    clearable
    :placeholder="placeholder || '材料类别编码/名称/拼音搜索'"
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
import { listMaterialCategory } from "@/api/foundation/materialCategory";
import { pinyin } from "pinyin-pro";

export default {
  props: ['value', 'value2', 'placeholder'],
  data() {
    return {
      materialCategoryOptions: [],
      allMaterialCategoryOptions: []
    };
  },
  computed: {
    materialCategory: {
      get() {
        return this.value;
      },
      set(v) {
        this.$emit('input', v);
      }
    }
  },
  created() {
    this.getList();
  },
  methods: {
    getList() {
      listMaterialCategory({ pageNum: 1, pageSize: 1000 }).then(response => {
        const rows = (response && response.rows) || [];
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
