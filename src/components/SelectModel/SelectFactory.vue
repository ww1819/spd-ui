<template>
  <el-select v-model="factory"
             size="small"
             popper-class="select-dropdown--multiline"
             filterable
             remote
             :remote-method="remoteMethod"
             :loading="loading"
             clearable
             :placeholder="placeholder || '厂家名称/编码/简码搜索'"
             :disabled="value2"
  >
    <el-option
      v-for="item in factoryOptions"
      :key="item.factoryId"
      :label="item.factoryName"
      :value="item.factoryId"
    >
      <el-tooltip
        :content="item.factoryName || ''"
        placement="top"
        effect="dark"
        :open-delay="250"
        popper-class="select-model-dropdown-tooltip"
      >
        <span class="select-option-label-wrap">{{ item.factoryName }}</span>
      </el-tooltip>
    </el-option>
  </el-select>
</template>

<script>
import { listFactoryAll, listFactory, getFactory } from "@/api/foundation/factory";
import { isForbiddenError } from "@/utils/requestFallback";

export default {
  // props: ['value','size'],
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
      // 厂家选项
      factoryOptions: [],
      allFactories: [],
      loading: false,
      // 表单参数
      form: {},
      // 无 list 权限时降级为 listAll 模式
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
    this.getList();
    this.ensureSelectedOption();
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
      const exists = this.factoryOptions.some(item => item.factoryId === this.value);
      if (exists) return;
      getFactory(this.value).then(response => {
        const row = response && response.data ? response.data : null;
        if (row) {
          this.factoryOptions = [row, ...this.factoryOptions];
          this.allFactories = [row, ...this.allFactories];
        }
      }).catch(() => {
        // 无查询权限时静默，避免影响组件使用
      });
    },
    remoteMethod(query) {
      const q = (query || '').trim();
      if (!q) {
        this.factoryOptions = this.filterEnabledFactories(this.allFactories).slice(0, 100);
        return;
      }
      const upper = q.toUpperCase();
      this.factoryOptions = this.filterEnabledFactories(this.allFactories.filter(item => {
        const name = (item.factoryName || '').toUpperCase();
        const code = (item.factoryCode || '').toUpperCase();
        const referred = (item.factoryReferredCode || '').toUpperCase();
        return name.includes(upper) || code.includes(upper) || referred.includes(upper);
      })).slice(0, 200);
      if (this.factoryOptions.length === 0 && !this.fallbackToListAll) {
        this.loading = true;
        listFactory({ factoryName: q, pageNum: 1, pageSize: 100, ...this.listQueryParams() }).then(response => {
          this.factoryOptions = this.filterEnabledFactories(response.rows || []);
        }).catch((err) => {
          if (isForbiddenError(err)) {
            this.fallbackToListAll = true;
            this.factoryOptions = this.filterEnabledFactories(this.allFactories.filter(item => {
              const name = (item.factoryName || '').toUpperCase();
              const code = (item.factoryCode || '').toUpperCase();
              const referred = (item.factoryReferredCode || '').toUpperCase();
              return name.includes(upper) || code.includes(upper) || referred.includes(upper);
            })).slice(0, 200);
          }
        }).finally(() => {
          this.loading = false;
        });
      }
    },
    /** 查询厂家列表 */
    getList() {
      this.loading = true;
      listFactoryAll(this.listQueryParams()).then(response => {
        this.allFactories = this.filterEnabledFactories(response || []);
        this.factoryOptions = this.allFactories.slice(0, 100);
      }).finally(() => {
        this.loading = false;
      });
    },
  }
}
</script>
