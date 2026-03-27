<template>
  <el-select v-model="supplier"
             popper-class="select-dropdown--multiline"
             filterable
             remote
             :remote-method="remoteMethod"
             clearable
             placeholder="供应商编码/名称/拼音简码搜索"
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
import { listSupplierAll, listSupplier, getSupplier} from "@/api/foundation/supplier";
import { pinyin } from 'pinyin-pro';

export default {
  // props: ['value','size'],
  props: ['value','value2'],
  data() {
    return {
      // 供应商选项
      supplierOptions: [],
      // 表单参数
      form: {},
      // 加载状态
      loading: false,
      // 所有供应商列表（用于首字母搜索）
      allSuppliers: [],
      // 搜索防抖定时器
      searchTimer: null,
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
    value() {
      this.ensureSelectedOption();
    }
  },
  created() {
    // 使用 remote 时，初始不加载数据，等待用户输入
    // 但需要预加载所有供应商用于首字母搜索
    this.loadAllSuppliers();
    // 初始加载少量数据，确保下拉框可以正常打开和输入
    this.loadInitialData();
    this.ensureSelectedOption();
  },
  beforeDestroy() {
    // 清理定时器
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
  },
  methods: {
    ensureSelectedOption() {
      if (!this.value) return;
      const exists = this.supplierOptions.some(item => item.id === this.value);
      if (exists) return;
      getSupplier(this.value).then(response => {
        const row = response && response.data ? response.data : null;
        if (row) {
          this.supplierOptions = [row, ...this.supplierOptions];
        }
      });
    },
    /** 预加载所有供应商（用于首字母搜索） */
    loadAllSuppliers() {
      listSupplierAll().then(response => {
        this.allSuppliers = response || [];
      }).catch(() => {
        this.allSuppliers = [];
      });
    },
    /** 加载初始数据（少量，用于确保下拉框可以正常打开） */
    loadInitialData() {
      listSupplier({
        pageNum: 1,
        pageSize: 20
      }).then(response => {
        this.supplierOptions = response.rows || [];
      }).catch(() => {
        this.supplierOptions = [];
      });
    },
    /** 查询供应商列表（用于非 remote 模式） */
    getList() {
      this.loading = true;
      listSupplierAll().then(response => {
        this.supplierOptions = response || [];
        this.loading = false;
      }).catch(() => {
        this.loading = false;
      });
    },
    /** 远程搜索方法 */
    remoteMethod(query) {
      // 清除之前的请求（如果有）
      if (this.searchTimer) {
        clearTimeout(this.searchTimer);
      }
      
      // 如果输入为空，清空选项
      if (!query || query.trim() === '') {
        this.supplierOptions = [];
        this.loading = false;
        return;
      }
      
      this.loading = true;
      const upperQuery = query.toUpperCase();
      
      // 使用防抖，避免频繁请求（减少到200ms）
      this.searchTimer = setTimeout(() => {
        this.doSearch(query.trim(), upperQuery);
      }, 200);
    },
    /** 执行搜索 */
    doSearch(query, upperQuery) {
      // 先尝试后端模糊搜索
      listSupplier({
        name: query,
        pageNum: 1,
        pageSize: 100
      }).then(response => {
        let results = response.rows || [];
        
        // 如果后端搜索结果为空，或者查询是纯字母（可能是首字母搜索），进行前端过滤
        if (results.length === 0 || this.isPinyin(query)) {
          // 确保有完整的供应商列表
          if (this.allSuppliers.length === 0) {
            return listSupplierAll().then(allResponse => {
              this.allSuppliers = allResponse || [];
              this.filterSuppliers(query, upperQuery);
            });
          } else {
            this.filterSuppliers(query, upperQuery);
          }
        } else {
          // 后端有结果，但也要支持首字母搜索，所以合并结果
          this.filterSuppliers(query, upperQuery, results);
        }
      }).catch(() => {
        // 如果后端搜索失败，使用前端过滤
        if (this.allSuppliers.length === 0) {
          listSupplierAll().then(allResponse => {
            this.allSuppliers = allResponse || [];
            this.filterSuppliers(query, upperQuery);
          });
        } else {
          this.filterSuppliers(query, upperQuery);
        }
      });
    },
    /** 判断是否为拼音首字母 */
    isPinyin(str) {
      return /^[a-zA-Z]+$/.test(str);
    },
    /** 过滤供应商（支持模糊搜索和首字母搜索） */
    filterSuppliers(query, upperQuery, backendResults = []) {
      const searchList = backendResults.length > 0 ? backendResults : this.allSuppliers;
      
      this.supplierOptions = searchList.filter(item => {
        if (!item.name) return false;
        
        const name = item.name;
        const nameUpper = name.toUpperCase();
        const queryLower = query.toLowerCase();
        
        // 1. 名称模糊匹配（不区分大小写）
        const code = item.code || item.supplierCode || '';
        const referredCode = item.referredCode || item.referredName || item.supplierReferredCode || '';
        if (name.includes(query) || nameUpper.includes(upperQuery) || code.toUpperCase().includes(upperQuery) || referredCode.toUpperCase().includes(upperQuery)) {
          return true;
        }
        
        // 2. 首字母匹配
        if (this.isPinyin(query)) {
          const pinyinInitials = this.getPinyinInitials(name);
          if (pinyinInitials.includes(upperQuery)) {
            return true;
          }
        }
        
        return false;
      });
      
      this.loading = false;
    },
    /** 获取中文拼音首字母 */
    getPinyinInitials(str) {
      try {
        // 使用 pinyin-pro 获取拼音首字母
        const initials = pinyin(str, {
          pattern: 'first',
          toneType: 'none',
          type: 'array',
        }).join('').toUpperCase();
        return initials;
      } catch (e) {
        // 如果转换失败，返回空字符串
        return '';
      }
    }
  }
}
</script>
