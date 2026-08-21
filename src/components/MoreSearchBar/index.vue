<template>
  <div class="more-search-bar">
    <el-row class="query-row-more">
      <el-col :span="24">
        <el-form-item class="query-item-inline more-search-item">
          <div class="more-search-row more-search-picker-row">
            <span class="more-search-label">{{ label }}</span>
            <el-select
              :value="value"
              multiple
              collapse-tags
              filterable
              :placeholder="placeholder"
              class="more-search-type"
              @input="onTypesInput"
              @change="onTypesChange"
            >
              <el-option
                v-for="opt in options"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
            <el-button
              v-if="showSave"
              size="small"
              class="spd-btn spd-btn--secondary more-search-save-btn"
              @click="saveDefaults"
            >{{ saveText }}</el-button>
            <template v-if="showSearchActions">
              <el-button
                type="primary"
                size="small"
                class="spd-btn spd-btn--primary"
                @click="$emit('search')"
              >搜索</el-button>
              <el-button
                size="small"
                class="spd-btn spd-btn--secondary"
                @click="$emit('reset')"
              >重置</el-button>
            </template>
            <slot name="actions" />
          </div>
        </el-form-item>
      </el-col>
    </el-row>

    <el-row v-if="$slots.default" class="query-row-fields">
      <el-col :span="24" class="query-row-fields-inner">
        <slot :types="value" />
      </el-col>
    </el-row>
  </div>
</template>

<script>
/**
 * 更多检索壳：维度多选 + 可选保存默认 + 搜索/重置 + 条件字段插槽
 * 字段渲染由各页通过默认插槽自行配置
 */
export default {
  name: 'MoreSearchBar',
  props: {
    value: {
      type: Array,
      default: () => []
    },
    options: {
      type: Array,
      default: () => []
    },
    /** localStorage key；空则不读写默认 */
    storageKey: {
      type: String,
      default: ''
    },
    /** 无缓存时的内置默认维度 */
    defaultTypes: {
      type: Array,
      default: () => []
    },
    label: {
      type: String,
      default: '更多检索'
    },
    placeholder: {
      type: String,
      default: '选择检索条件（可多选）'
    },
    saveText: {
      type: String,
      default: '保存为默认显示条件'
    },
    showSave: {
      type: Boolean,
      default: true
    },
    showSearchActions: {
      type: Boolean,
      default: true
    },
    /** 挂载时若 value 为空则自动加载默认 */
    autoLoad: {
      type: Boolean,
      default: true
    }
  },
  mounted() {
    if (!this.autoLoad) return;
    if (Array.isArray(this.value) && this.value.length) return;
    const loaded = this.loadDefaults();
    if (loaded.length) {
      this.$emit('input', loaded);
      this.$emit('change', loaded);
    }
  },
  methods: {
    onTypesInput(val) {
      this.$emit('input', val);
    },
    onTypesChange(val) {
      this.$emit('change', val);
    },
    allowSet() {
      return new Set((this.options || []).map(o => o.value));
    },
    loadDefaults() {
      const fallback = Array.isArray(this.defaultTypes) ? this.defaultTypes.slice() : [];
      if (!this.storageKey) return fallback;
      try {
        const raw = localStorage.getItem(this.storageKey);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return fallback;
        const allow = this.allowSet();
        const cleaned = parsed.filter(v => allow.has(v));
        return cleaned.length ? cleaned : fallback;
      } catch (e) {
        return fallback;
      }
    },
    saveDefaults() {
      if (!this.storageKey) {
        this.$modal && this.$modal.msgWarning('未配置存储键，无法保存默认条件');
        return;
      }
      const types = Array.isArray(this.value) ? this.value.slice() : [];
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(types));
        this.$modal && this.$modal.msgSuccess('已保存为默认显示条件');
        this.$emit('save-defaults', types);
      } catch (e) {
        this.$modal && this.$modal.msgError('保存失败，请检查浏览器是否禁用本地存储');
      }
    }
  }
};
</script>
