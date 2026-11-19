<template>
  <el-select
    ref="factorySelect"
    v-model="factory"
    popper-class="select-dropdown--multiline"
    filterable
    :filter-method="filterMethod"
    :loading="loading"
    clearable
    :placeholder="placeholder || '生产厂家'"
    :disabled="value2"
    default-first-option
    @visible-change="onFactoryDropdownVisible"
    @clear="onFactoryClear"
  >
    <el-option
      v-for="item in factoryOptions"
      :key="item.factoryId"
      :label="item.factoryName"
      :value="item.factoryId"
    >
      <span class="select-option-label-wrap">{{ item.factoryName }}</span>
    </el-option>
  </el-select>
</template>

<script>
import { listFactoryAll, listFactory, getFactory } from "@/api/foundation/factory";
import { isForbiddenError } from "@/utils/requestFallback";
import { pinyin } from "pinyin-pro";

let factoryAllListCache;
let factoryAllListInflight;

function getCachedListFactoryAll(params) {
  if (!params && factoryAllListCache !== undefined) {
    return Promise.resolve(factoryAllListCache);
  }
  if (!params && factoryAllListInflight) {
    return factoryAllListInflight;
  }
  const req = listFactoryAll(params || {}).then((response) => {
    if (!params) {
      factoryAllListCache = response || [];
      factoryAllListInflight = null;
      return factoryAllListCache;
    }
    return response || [];
  }).catch((e) => {
    if (!params) {
      factoryAllListInflight = null;
    }
    return Promise.reject(e);
  });
  if (!params) {
    factoryAllListInflight = req;
  }
  return req;
}

export default {
  props: {
    value: {},
    value2: {},
    placeholder: {},
    /** 为 true 时仅展示启用厂家（耗材字典等选厂家场景） */
    onlyEnabled: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      factoryOptions: [],
      allFactories: [],
      loading: false,
      searchTimer: null,
      fallbackToListAll: false,
    }
  },
  computed: {
    factory: {
      get() {
        return this.value;
      },
      set(v) {
        this.$emit('input', v);
      }
    }
  },
  watch: {
    value() {
      this.ensureSelectedOption();
    }
  },
  created() {
    this.loadAllFactories();
    this.ensureSelectedOption();
  },
  beforeDestroy() {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
  },
  methods: {
    isFactoryEnabled(item) {
      if (!item) return false;
      const status = item.factoryStatus;
      if (status == null || status === '') return true;
      return String(status) === '1';
    },
    filterEnabledFactories(list) {
      const rows = Array.isArray(list) ? list : [];
      if (!this.onlyEnabled) return rows;
      return rows.filter(item => this.isFactoryEnabled(item));
    },
    listQueryParams(extra) {
      const params = { ...(extra || {}) };
      if (this.onlyEnabled) {
        params.onlyEnabled = true;
      }
      return params;
    },
    ensureSelectedOption() {
      if (!this.value) return;
      const exists = this.factoryOptions.some(item => String(item.factoryId) === String(this.value));
      if (exists) return;
      const hit = (this.allFactories || []).find(item => String(item.factoryId) === String(this.value));
      if (hit) {
        this.factoryOptions = [hit, ...this.factoryOptions.filter(i => String(i.factoryId) !== String(hit.factoryId))];
        return;
      }
      getFactory(this.value).then(response => {
        const row = response && response.data ? response.data : null;
        if (row) {
          this.factoryOptions = [row, ...this.factoryOptions];
          this.allFactories = [row, ...this.allFactories.filter(i => String(i.factoryId) !== String(row.factoryId))];
        }
      }).catch(() => {});
    },
    loadAllFactories() {
      this.loading = true;
      const loader = this.onlyEnabled
        ? () => listFactoryAll(this.listQueryParams())
        : () => getCachedListFactoryAll();
      loader().then((response) => {
        this.allFactories = this.filterEnabledFactories(response || []);
        this.factoryOptions = this.allFactories.slice();
        this.ensureSelectedOption();
      }).catch((err) => {
        if (isForbiddenError(err)) {
          this.fallbackToListAll = true;
        }
        listFactory({
          pageNum: 1,
          pageSize: 100,
          ...this.listQueryParams()
        }).then(response => {
          this.allFactories = this.filterEnabledFactories(response.rows || []);
          this.factoryOptions = this.allFactories.slice();
        }).catch(() => {
          this.factoryOptions = [];
        });
      }).finally(() => {
        this.loading = false;
      });
    },
    onFactoryDropdownVisible(visible) {
      if (!visible) {
        return;
      }
      const showAll = () => {
        this.factoryOptions = this.filterEnabledFactories(this.allFactories || []).slice();
        this.ensureSelectedOption();
      };
      if (this.allFactories.length > 0) {
        showAll();
        return;
      }
      this.loading = true;
      const loader = this.onlyEnabled
        ? () => listFactoryAll(this.listQueryParams())
        : () => getCachedListFactoryAll();
      loader()
        .then((response) => {
          this.allFactories = this.filterEnabledFactories(response || []);
          showAll();
        })
        .catch(() => {
          this.factoryOptions = [];
        })
        .finally(() => {
          this.loading = false;
        });
    },
    onFactoryClear() {
      this.factoryOptions = this.filterEnabledFactories(this.allFactories || []).slice();
    },
    filterMethod(query) {
      if (this.searchTimer) {
        clearTimeout(this.searchTimer);
      }
      const text = query != null ? String(query).trim() : '';
      if (!text) {
        this.factoryOptions = this.filterEnabledFactories(this.allFactories || []).slice();
        this.ensureSelectedOption();
        this.loading = false;
        return;
      }
      const upperQuery = text.toUpperCase();
      this.searchTimer = setTimeout(() => {
        this.filterFactories(text, upperQuery);
      }, 120);
    },
    isPinyin(str) {
      return /^[a-zA-Z]+$/.test(str);
    },
    getPinyinInitials(str) {
      try {
        return pinyin(str, {
          pattern: 'first',
          toneType: 'none',
          type: 'array',
        }).join('').toUpperCase();
      } catch (e) {
        return '';
      }
    },
    filterFactories(query, upperQuery) {
      const searchList = this.filterEnabledFactories(this.allFactories || []);
      this.factoryOptions = searchList.filter(item => {
        const name = item.factoryName || '';
        const nameUpper = name.toUpperCase();
        const code = (item.factoryCode || '').toUpperCase();
        const referred = (item.factoryReferredCode || '').toUpperCase();
        if (name.includes(query) || nameUpper.includes(upperQuery) || code.includes(upperQuery) || referred.includes(upperQuery)) {
          return true;
        }
        if (this.isPinyin(query)) {
          const initials = this.getPinyinInitials(name);
          if (initials.includes(upperQuery)) {
            return true;
          }
        }
        return false;
      });
      this.loading = false;
    },
  }
}
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
