<template>
  <el-select v-model="factory"
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

export default {
  // props: ['value','size'],
  props: ['value','value2','placeholder'],
  data() {
    return {
      // 厂家选项
      factoryOptions: [],
      allFactories: [],
      loading: false,
      // 表单参数
      form: {},
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
      });
    },
    remoteMethod(query) {
      const q = (query || '').trim();
      if (!q) {
        this.factoryOptions = this.allFactories.slice(0, 100);
        return;
      }
      const upper = q.toUpperCase();
      this.factoryOptions = this.allFactories.filter(item => {
        const name = (item.factoryName || '').toUpperCase();
        const code = (item.factoryCode || '').toUpperCase();
        const referred = (item.factoryReferredCode || '').toUpperCase();
        return name.includes(upper) || code.includes(upper) || referred.includes(upper);
      }).slice(0, 200);
      if (this.factoryOptions.length === 0) {
        this.loading = true;
        listFactory({ factoryName: q, pageNum: 1, pageSize: 100 }).then(response => {
          this.factoryOptions = response.rows || [];
        }).finally(() => {
          this.loading = false;
        });
      }
    },
    /** 查询厂家列表 */
    getList() {
      this.loading = true;
      listFactoryAll().then(response => {
        this.allFactories = response || [];
        this.factoryOptions = this.allFactories.slice(0, 100);
      }).finally(() => {
        this.loading = false;
      });
    },
  }
}
</script>
