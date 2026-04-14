<template>
  <el-select
    v-model="supplier"
    popper-class="select-dropdown--multiline"
    filterable
    remote
    :remote-method="remoteMethod"
    clearable
    :placeholder="placeholder"
    :disabled="value2"
    :loading="loading"
    default-first-option
  >
    <el-option
      v-for="item in supplierOptions"
      :key="item.id"
      :label="item.name"
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
import { listSupplierDeptSafe } from "@/api/foundation/supplier";
import { pinyin } from "pinyin-pro";

export default {
  props: {
    value: {},
    value2: {},
    placeholder: {
      type: String,
      default: "供应商",
    },
  },
  data() {
    return {
      supplierOptions: [],
      loading: false,
      allSuppliers: [],
      searchTimer: null,
    };
  },
  computed: {
    supplier: {
      get() {
        return this.value;
      },
      set(v) {
        this.$emit("input", v);
      },
    },
  },
  watch: {
    value() {
      this.ensureSelectedOption();
    },
  },
  created() {
    this.loadAllSuppliers();
  },
  beforeDestroy() {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
  },
  methods: {
    loadAllSuppliers() {
      this.loading = true;
      listSupplierDeptSafe()
        .then((response) => {
          const all = response || [];
          this.allSuppliers = all;
          this.supplierOptions = all.slice(0, 20);
          this.ensureSelectedOption();
        })
        .catch(() => {
          this.allSuppliers = [];
          this.supplierOptions = [];
        })
        .finally(() => {
          this.loading = false;
        });
    },
    ensureSelectedOption() {
      if (!this.value || !Array.isArray(this.allSuppliers)) return;
      const exists = this.supplierOptions.some((item) => item.id === this.value);
      if (exists) return;
      const hit = this.allSuppliers.find((item) => item.id === this.value);
      if (hit) {
        this.supplierOptions = [hit, ...this.supplierOptions];
      }
    },
    remoteMethod(query) {
      if (this.searchTimer) {
        clearTimeout(this.searchTimer);
      }
      if (!query || query.trim() === "") {
        this.supplierOptions = this.allSuppliers.slice(0, 20);
        this.loading = false;
        return;
      }
      this.loading = true;
      const upperQuery = query.toUpperCase();
      this.searchTimer = setTimeout(() => {
        this.filterSuppliers(query.trim(), upperQuery);
      }, 200);
    },
    isPinyin(str) {
      return /^[a-zA-Z]+$/.test(str);
    },
    filterSuppliers(query, upperQuery) {
      const usePinyin = this.isPinyin(query);
      this.supplierOptions = this.allSuppliers.filter((item) => {
        if (!item || !item.name) return false;
        const name = item.name;
        const nameUpper = name.toUpperCase();
        const code = item.code || "";
        const referredCode = item.referredCode || "";
        if (
          name.includes(query) ||
          nameUpper.includes(upperQuery) ||
          code.toUpperCase().includes(upperQuery) ||
          referredCode.toUpperCase().includes(upperQuery)
        ) {
          return true;
        }
        if (usePinyin) {
          const pinyinInitials = this.getPinyinInitials(name);
          return pinyinInitials.includes(upperQuery);
        }
        return false;
      });
      this.loading = false;
    },
    getPinyinInitials(str) {
      try {
        return pinyin(str, {
          pattern: "first",
          toneType: "none",
          type: "array",
        })
          .join("")
          .toUpperCase();
      } catch (e) {
        return "";
      }
    },
  },
};
</script>
