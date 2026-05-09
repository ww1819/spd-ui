<template>
  <el-select
    v-model="innerValue"
    filterable
    :filter-method="filterMethod"
    clearable
    :multiple="multiple"
    collapse-tags
    collapse-tags-tooltip
    :placeholder="placeholder || '财务分类编码/名称/简拼搜索'"
    :disabled="disabled"
  >
    <el-option
      v-for="item in financeCategoryOptions"
      :key="item.financeCategoryId"
      :label="buildLabel(item)"
      :value="item.financeCategoryId"
    />
  </el-select>
</template>

<script>
import { listFinanceCategoryAll } from "@/api/foundation/financeCategory";
import { pinyin } from "pinyin-pro";

export default {
  name: "SelectFinanceCategoryLow",
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
      allFinanceCategoryOptions: [],
      financeCategoryOptions: []
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
      listFinanceCategoryAll().then(response => {
        this.allFinanceCategoryOptions = response || [];
        this.financeCategoryOptions = this.allFinanceCategoryOptions;
      });
    },
    buildLabel(item) {
      const code = item.financeCategoryCode || "";
      const name = item.financeCategoryName || "";
      return code ? `${code} / ${name}` : name;
    },
    filterMethod(query) {
      if (!query) {
        this.financeCategoryOptions = this.allFinanceCategoryOptions;
        return;
      }
      const q = query.trim().toUpperCase();
      this.financeCategoryOptions = this.allFinanceCategoryOptions.filter(item => {
        const code = String(item.financeCategoryCode || "").toUpperCase();
        const name = String(item.financeCategoryName || "").toUpperCase();
        const referred = String(item.referredName || "").toUpperCase();
        const py = this.getPinyinInitials(item.financeCategoryName || "");
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
