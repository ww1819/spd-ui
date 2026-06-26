<template>
  <el-autocomplete
    v-if="allowKeywordBlur"
    ref="supplierAutocomplete"
    v-model="displayText"
    class="select-supplier-autocomplete"
    popper-class="select-dropdown--multiline"
    :fetch-suggestions="fetchSuggestions"
    :placeholder="placeholder"
    :disabled="value2"
    :trigger-on-focus="false"
    clearable
    @select="handleAutocompleteSelect"
    @clear="handleAutocompleteClear"
    @input="handleAutocompleteInput"
  >
    <template slot-scope="{ item }">
      <el-tooltip
        :content="item.name || ''"
        placement="top"
        effect="dark"
        :open-delay="250"
        popper-class="select-model-dropdown-tooltip"
      >
        <span class="select-option-label-wrap">{{ item.name }}</span>
      </el-tooltip>
    </template>
  </el-autocomplete>
  <el-select
    v-else
    ref="supplierSelect"
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
import { listSupplierAll, listSupplier, getSupplier, listSupplierDeptSafe } from "@/api/foundation/supplier";
import { fetchFinancePickSupplierById } from "@/api/finance/settlementSummary";
import { pinyin } from 'pinyin-pro';
import { isForbiddenError } from "@/utils/requestFallback";

/** 全量供应商列表进程内缓存：表格多行各挂一个 SelectSupplier 时避免重复打 listAll */
let supplierAllListCache;
let supplierAllListInflight;

function getCachedListSupplierAll() {
  if (supplierAllListCache !== undefined) {
    return Promise.resolve(supplierAllListCache);
  }
  if (supplierAllListInflight) {
    return supplierAllListInflight;
  }
  supplierAllListInflight = listSupplierAll()
    .then((response) => {
      supplierAllListCache = response || [];
      supplierAllListInflight = null;
      return supplierAllListCache;
    })
    .catch((e) => {
      supplierAllListInflight = null;
      return Promise.reject(e);
    });
  return supplierAllListInflight;
}

export default {
  props: {
    value: {},
    value2: {},
    placeholder: {
      type: String,
      default: '供应商'
    },
    /** 为 true 时用科室低敏列表 + 财务 pick 详情，避免 foundation:supplier:list/query 权限不足 */
    financePickMode: {
      type: Boolean,
      default: false
    },
    /** 未选中下拉项时保留的模糊检索关键词（与 allowKeywordBlur 配合） */
    keyword: {
      type: String,
      default: ''
    },
    /** 为 true 时：失焦后保留输入文本，可从下拉精确选择或仅关键词模糊检索 */
    allowKeywordBlur: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      supplierOptions: [],
      form: {},
      loading: false,
      allSuppliers: [],
      searchTimer: null,
      fallbackToListAll: false,
      lastQuery: '',
      displayText: '',
      selectingFromList: false,
    }
  },
  computed: {
    supplier: {
      get() {
        return this.value;
      },
      set(v) {
        this.$emit('input', v);
      }
    }
  },
  watch: {
    value(val) {
      if (this.allowKeywordBlur) {
        if (val) {
          this.syncDisplayFromSelectedId(val);
        } else if (!this.selectingFromList) {
          this.displayText = this.keyword ? String(this.keyword).trim() : '';
        }
        return;
      }
      this.ensureSelectedOption();
    },
    keyword(val) {
      if (!this.allowKeywordBlur || this.value) {
        return;
      }
      const text = val != null ? String(val).trim() : '';
      this.displayText = text;
    }
  },
  created() {
    if (this.financePickMode) {
      this.loadFinancePickSupplierBase();
      return;
    }
    this.loadAllSuppliers();
    if (this.allowKeywordBlur) {
      if (this.value) {
        this.syncDisplayFromSelectedId(this.value);
      } else if (this.keyword) {
        this.displayText = String(this.keyword).trim();
      }
      return;
    }
    this.loadInitialData();
    this.ensureSelectedOption();
  },
  beforeDestroy() {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
  },
  methods: {
    syncDisplayFromSelectedId(id) {
      if (id == null || id === '') {
        return;
      }
      const hit = (this.supplierOptions || [])
        .concat(this.allSuppliers || [])
        .find(item => String(item.id) === String(id));
      if (hit && hit.name) {
        this.displayText = hit.name;
        return;
      }
      if (this.financePickMode) {
        fetchFinancePickSupplierById(id)
          .then(res => {
            const row = res && res.data ? res.data : null;
            if (row && row.name) {
              this.displayText = row.name;
            }
          })
          .catch(() => {});
        return;
      }
      getSupplier(id)
        .then(response => {
          const row = response && response.data ? response.data : null;
          if (row && row.name) {
            this.displayText = row.name;
          }
        })
        .catch(() => {});
    },
    handleAutocompleteInput(val) {
      if (this.selectingFromList) {
        return;
      }
      this.lastQuery = val || '';
      if (this.value) {
        this.$emit('input', null);
      }
      this.$emit('update:keyword', (val || '').trim());
    },
    handleAutocompleteSelect(item) {
      if (!item || item.id == null) {
        return;
      }
      this.selectingFromList = true;
      this.$emit('input', item.id);
      this.$emit('update:keyword', '');
      this.lastQuery = '';
      this.displayText = item.name || '';
      this.$nextTick(() => {
        this.selectingFromList = false;
      });
    },
    handleAutocompleteClear() {
      this.lastQuery = '';
      this.displayText = '';
      this.$emit('input', null);
      this.$emit('update:keyword', '');
    },
    fetchSuggestions(queryString, cb) {
      if (this.searchTimer) {
        clearTimeout(this.searchTimer);
      }
      const query = queryString != null ? String(queryString).trim() : '';
      this.lastQuery = query;
      if (!query) {
        cb([]);
        return;
      }
      this.loading = true;
      const upperQuery = query.toUpperCase();
      this.searchTimer = setTimeout(() => {
        this.doSearch(query, upperQuery, (list) => {
          cb((list || []).map(item => ({
            ...item,
            value: item.name || ''
          })));
        });
      }, 200);
    },
    ensureSelectedOption() {
      if (!this.value) return;
      const exists = this.supplierOptions.some(item => item.id === this.value);
      if (exists) return;
      if (this.financePickMode) {
        const hit = (this.allSuppliers || []).find(item => item.id === this.value);
        if (hit) {
          this.supplierOptions = [hit, ...this.supplierOptions.filter(i => i.id !== hit.id)];
          return;
        }
        fetchFinancePickSupplierById(this.value)
          .then(res => {
            const row = res && res.data ? res.data : null;
            if (row && row.id != null) {
              this.supplierOptions = [row, ...this.supplierOptions.filter(i => i.id !== row.id)];
            }
          })
          .catch(() => {});
        return;
      }
      getSupplier(this.value).then(response => {
        const row = response && response.data ? response.data : null;
        if (row) {
          this.supplierOptions = [row, ...this.supplierOptions];
        }
      }).catch(() => {});
    },
    loadFinancePickSupplierBase() {
      this.loading = true;
      listSupplierDeptSafe()
        .then(response => {
          const all = response || [];
          this.allSuppliers = all;
          this.supplierOptions = all.slice(0, 20);
          if (this.allowKeywordBlur && this.value) {
            this.syncDisplayFromSelectedId(this.value);
          } else {
            this.ensureSelectedOption();
          }
        })
        .catch(() => {
          this.allSuppliers = [];
          this.supplierOptions = [];
        })
        .finally(() => {
          this.loading = false;
        });
    },
    loadAllSuppliers() {
      if (this.financePickMode) {
        return;
      }
      getCachedListSupplierAll().then((all) => {
        this.allSuppliers = all || [];
      }).catch(() => {
        this.allSuppliers = [];
      });
    },
    loadInitialData() {
      if (this.financePickMode) {
        return;
      }
      listSupplier({
        pageNum: 1,
        pageSize: 20
      }).then(response => {
        this.supplierOptions = response.rows || [];
      }).catch((err) => {
        if (isForbiddenError(err)) {
          this.fallbackToListAll = true;
        }
        if (this.allSuppliers.length > 0) {
          this.supplierOptions = this.allSuppliers.slice(0, 20);
          return;
        }
        getCachedListSupplierAll().then((allResponse) => {
          this.allSuppliers = allResponse || [];
          this.supplierOptions = this.allSuppliers.slice(0, 20);
        }).catch(() => {
          this.supplierOptions = [];
        });
      });
    },
    getList() {
      this.loading = true;
      getCachedListSupplierAll().then((response) => {
        this.supplierOptions = response || [];
        this.loading = false;
      }).catch(() => {
        this.loading = false;
      });
    },
    remoteMethod(query) {
      if (this.searchTimer) {
        clearTimeout(this.searchTimer);
      }
      if (!query || query.trim() === '') {
        if (this.financePickMode) {
          this.supplierOptions = (this.allSuppliers || []).slice(0, 20);
          this.loading = false;
          return;
        }
        this.supplierOptions = [];
        this.loading = false;
        return;
      }
      this.loading = true;
      const upperQuery = query.toUpperCase();
      this.searchTimer = setTimeout(() => {
        this.doSearch(query.trim(), upperQuery);
      }, 200);
    },
    doSearch(query, upperQuery, cb) {
      if (this.financePickMode) {
        this.loading = true;
        listSupplierDeptSafe({ name: query })
          .then(response => {
            const rows = response || [];
            this.filterSuppliers(query, upperQuery, rows, cb);
          })
          .catch(() => {
            this.filterSuppliers(query, upperQuery, [], cb);
          });
        return;
      }
      if (this.fallbackToListAll) {
        if (this.allSuppliers.length === 0) {
          getCachedListSupplierAll().then((allResponse) => {
            this.allSuppliers = allResponse || [];
            this.filterSuppliers(query, upperQuery, [], cb);
          }).catch(() => {
            if (cb) {
              cb([]);
            } else {
              this.supplierOptions = [];
            }
            this.loading = false;
          });
        } else {
          this.filterSuppliers(query, upperQuery, [], cb);
        }
        return;
      }
      listSupplier({
        name: query,
        pageNum: 1,
        pageSize: 100
      }).then(response => {
        let results = response.rows || [];
        if (results.length === 0 || this.isPinyin(query)) {
          if (this.allSuppliers.length === 0) {
            return getCachedListSupplierAll().then((allResponse) => {
              this.allSuppliers = allResponse || [];
              this.filterSuppliers(query, upperQuery, [], cb);
            });
          }
          this.filterSuppliers(query, upperQuery, [], cb);
        } else {
          this.filterSuppliers(query, upperQuery, results, cb);
        }
      }).catch((err) => {
        if (isForbiddenError(err)) {
          this.fallbackToListAll = true;
        }
        if (this.allSuppliers.length === 0) {
          getCachedListSupplierAll().then((allResponse) => {
            this.allSuppliers = allResponse || [];
            this.filterSuppliers(query, upperQuery, [], cb);
          }).catch(() => {
            if (cb) {
              cb([]);
            } else {
              this.supplierOptions = [];
            }
            this.loading = false;
          });
        } else {
          this.filterSuppliers(query, upperQuery, [], cb);
        }
      });
    },
    isPinyin(str) {
      return /^[a-zA-Z]+$/.test(str);
    },
    filterSuppliers(query, upperQuery, backendResults = [], cb) {
      const searchList = backendResults.length > 0 ? backendResults : this.allSuppliers;
      const filtered = searchList.filter(item => {
        if (!item.name) return false;
        const name = item.name;
        const nameUpper = name.toUpperCase();
        const code = item.code || '';
        const referredCode = item.referredCode || '';
        if (name.includes(query) || nameUpper.includes(upperQuery) || code.toUpperCase().includes(upperQuery) || referredCode.toUpperCase().includes(upperQuery)) {
          return true;
        }
        if (this.isPinyin(query)) {
          const pinyinInitials = this.getPinyinInitials(name);
          if (pinyinInitials.includes(upperQuery)) {
            return true;
          }
        }
        return false;
      });
      if (typeof cb === 'function') {
        cb(filtered);
      } else {
        this.supplierOptions = filtered;
      }
      this.loading = false;
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
    }
  }
}
</script>

<style scoped>
.select-supplier-autocomplete {
  width: 100%;
}

.select-option-label-wrap {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}
</style>
