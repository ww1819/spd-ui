<template>
  <el-select
    v-model="material"
    popper-class="select-dropdown--multiline"
    filterable
    :filter-method="filterMaterialOption"
    clearable
    reserve-keyword
    :placeholder="placeholder"
    :disabled="value2"
    :loading="loading"
    default-first-option
  >
    <el-option
      v-for="item in materialOptions"
      :key="item.id"
      :label="formatMaterialOptionLabel(item)"
      :value="item.id"
    >
      <span class="select-option-label-wrap">{{ formatMaterialOptionLabel(item) }}</span>
    </el-option>
  </el-select>
</template>

<script>
import { listMaterialDeptSafe } from "@/api/foundation/material";
import { matchMaterialKeyword, normalizeMaterialSearchKeyword } from "@/utils/materialSearch";

export default {
  props: {
    value: {},
    value2: {},
    placeholder: {
      type: String,
      default: "名称/编码/拼音首字母",
    },
  },
  data() {
    return {
      materialOptions: [],
      allMaterials: [],
      loading: false,
    };
  },
  computed: {
    material: {
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
    this.loadAllMaterials();
  },
  methods: {
    formatMaterialOptionLabel(item) {
      if (!item) {
        return "";
      }
      const code = item.code ? String(item.code).trim() : "";
      const name = item.name ? String(item.name).trim() : "";
      if (code && name) {
        return `[${code}] ${name}`;
      }
      return name || code;
    },
    loadAllMaterials() {
      this.loading = true;
      listMaterialDeptSafe()
        .then((response) => {
          const all = response || [];
          this.allMaterials = all;
          this.materialOptions = all.slice(0, 100);
          this.ensureSelectedOption();
        })
        .catch(() => {
          this.allMaterials = [];
          this.materialOptions = [];
        })
        .finally(() => {
          this.loading = false;
        });
    },
    ensureSelectedOption() {
      if (!this.value || !Array.isArray(this.allMaterials)) return;
      const exists = this.materialOptions.some((item) => item.id === this.value);
      if (exists) return;
      const hit = this.allMaterials.find((item) => item.id === this.value);
      if (hit) {
        this.materialOptions = [hit, ...this.materialOptions];
      }
    },
    filterMaterialOption(query) {
      const q = normalizeMaterialSearchKeyword(query);
      if (!q) {
        this.materialOptions = (this.allMaterials || []).slice(0, 100);
        return;
      }
      this.materialOptions = (this.allMaterials || [])
        .filter((item) => matchMaterialKeyword(item, q))
        .slice(0, 100);
    },
  },
};
</script>
