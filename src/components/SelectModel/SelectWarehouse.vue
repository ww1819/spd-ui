<template>
  <el-select v-model="warehouse"
             filterable
             :filter-method="filterMethod"
             clearable
             :multiple="multiple"
             :collapse-tags="multiple"
             :collapse-tags-tooltip="multiple"
             :placeholder="placeholder || (multiple ? '仓库多选' : '仓库编码/名称/简码搜索')"
             :disabled="value2"
  >
    <el-option
      v-for="item in filteredWarehouseOptions"
      :key="item.id"
      :label="item.name"
      :value="item.id"
    ></el-option>
  </el-select>
</template>

<script>
import { listWarehouseAll, checkWarehouseInboundEnabled } from "@/api/foundation/warehouse";
import { fetchFinancePickWarehouses } from "@/api/finance/settlementSummary";
import { pinyin } from "pinyin-pro";
import { isWarehouseDisabled, findWarehouseById } from "@/utils/warehouseStatus";

export default {
  props: {
    value: {
      type: [Number, String, Array],
      default: null
    },
    value2: {},
    excludeWarehouseType: {},
    includeWarehouseType: {},
    /** 为 true 时走财务结算汇总专用 pick 接口（仅需登录），避免 foundation:warehouse:list 等权限不足 */
    financePickMode: {
      type: Boolean,
      default: false
    },
    multiple: {
      type: Boolean,
      default: false
    },
    placeholder: {
      type: String,
      default: ''
    },
    /** 入库场景：选中已停用仓库时拦截并提示 */
    blockDisabledForInbound: {
      type: Boolean,
      default: false
    },
    disabledWarehouseMessage: {
      type: String,
      default: '该仓库已经停用，不能在进行入库'
    }
  },
  data() {
    return {
      // 仓库选项
      warehouseOptions: [],
      allWarehouseOptions: [],
      // 表单参数
      form: {},
      lastValidWarehouse: null,
    }
  },
  computed: {
    warehouse: {
      get() {
        if (this.multiple) {
          return Array.isArray(this.value) ? this.value : [];
        }
        // 确保返回的值能在选项列表中找到对应的项
        if (this.value && this.filteredWarehouseOptions.length > 0) {
          // 检查值是否在选项列表中（支持字符串和数字类型匹配）
          const found = this.filteredWarehouseOptions.find(item => {
            return String(item.id) === String(this.value) || item.id == this.value;
          });
          if (found) {
            return found.id;
          }
        }
        return this.value;
      },
      set(v) {
        if (!this.blockDisabledForInbound || v == null || v === '' || this.multiple) {
          this.lastValidWarehouse = v;
          this.$emit('input', v);
          return;
        }
        this.verifyInboundWarehouse(v, this.disabledWarehouseMessage).then((ok) => {
          if (ok) {
            this.lastValidWarehouse = v;
            this.$emit('input', v);
          } else {
            this.$nextTick(() => {
              this.$emit('input', this.lastValidWarehouse);
            });
          }
        });
      }
    },
    // 过滤后的仓库选项
    filteredWarehouseOptions() {
      // 如果指定了只包含某个类型，则只显示该类型的仓库
      if (this.includeWarehouseType) {
        return this.warehouseOptions.filter(item => {
          return item.warehouseType === this.includeWarehouseType;
        });
      }
      // 如果指定了排除某个类型，则排除该类型的仓库
      if (this.excludeWarehouseType) {
        // 支持数组、逗号分隔的字符串或单个字符串
        let excludeTypes = [];
        if (Array.isArray(this.excludeWarehouseType)) {
          excludeTypes = this.excludeWarehouseType;
        } else if (typeof this.excludeWarehouseType === 'string') {
          excludeTypes = this.excludeWarehouseType.split(',').map(t => t.trim());
        }

        return this.warehouseOptions.filter(item => {
          // 如果仓库类型为空或不在排除列表中，则保留
          return !item.warehouseType || !excludeTypes.includes(item.warehouseType);
        });
      }
      // 如果都没有指定，返回所有仓库
      return this.warehouseOptions;
    }
  },
  created() {
    this.lastValidWarehouse = this.multiple
      ? (Array.isArray(this.value) ? this.value : [])
      : this.value;
    this.getList();
  },
  watch: {
    value(val) {
      if (this.blockDisabledForInbound && val != null && val !== '' && !this.multiple) {
        if (isWarehouseDisabled(findWarehouseById(this.allWarehouseOptions, val)) === true) {
          this.$modal.msgWarning(this.disabledWarehouseMessage);
          this.$nextTick(() => {
            this.$emit('input', this.lastValidWarehouse);
          });
          return;
        }
        this.verifyInboundWarehouse(val, this.disabledWarehouseMessage, false).then((ok) => {
          if (ok) {
            this.lastValidWarehouse = val;
          } else {
            this.$nextTick(() => {
              this.$emit('input', this.lastValidWarehouse);
            });
          }
        });
      } else if (!this.multiple) {
        this.lastValidWarehouse = val;
      }
    },
    allWarehouseOptions() {
      if (this.blockDisabledForInbound && this.value != null && this.value !== '' && !this.multiple) {
        if (isWarehouseDisabled(findWarehouseById(this.allWarehouseOptions, this.value)) === true) {
          this.$modal.msgWarning(this.disabledWarehouseMessage);
          this.$nextTick(() => {
            this.$emit('input', this.lastValidWarehouse);
          });
          return;
        }
        this.verifyInboundWarehouse(this.value, this.disabledWarehouseMessage, false).then((ok) => {
          if (ok) {
            this.lastValidWarehouse = this.value;
          } else {
            this.$nextTick(() => {
              this.$emit('input', this.lastValidWarehouse);
            });
          }
        });
      }
    }
  },
  methods: {
    findWarehouseById(warehouseId) {
      return findWarehouseById(this.allWarehouseOptions, warehouseId);
    },
    verifyInboundWarehouse(warehouseId, message, showMessage = true) {
      const warnMessage = message || this.disabledWarehouseMessage;
      const local = this.findWarehouseById(warehouseId);
      if (isWarehouseDisabled(local) === true) {
        if (showMessage) {
          this.$modal.msgWarning(warnMessage);
        }
        return Promise.resolve(false);
      }
      return checkWarehouseInboundEnabled(warehouseId)
        .then(() => true)
        .catch((err) => {
          if (showMessage) {
            this.$modal.msgWarning((err && err.message) || warnMessage);
          }
          return false;
        });
    },
    validateInboundSelection(message) {
      if (!this.blockDisabledForInbound || this.multiple) {
        return Promise.resolve(true);
      }
      const warehouseId = this.value;
      if (warehouseId == null || warehouseId === '') {
        return Promise.resolve(true);
      }
      return this.verifyInboundWarehouse(warehouseId, message || this.disabledWarehouseMessage);
    },
    normalizeWarehouseOptions(rows) {
      return (rows || []).map((item) => {
        const status = item.warehouseStatus != null ? item.warehouseStatus : item.warehouse_status;
        if (status == null || status === '') {
          return item;
        }
        return {
          ...item,
          warehouseStatus: String(status).trim()
        };
      });
    },
    /** 查询仓库列表 */
    getList() {
      if (this.financePickMode) {
        fetchFinancePickWarehouses()
          .then(res => {
            const rows = res && res.data != null ? res.data : res;
            this.allWarehouseOptions = this.normalizeWarehouseOptions(Array.isArray(rows) ? rows : []);
            this.warehouseOptions = this.allWarehouseOptions;
          })
          .catch(() => {
            this.allWarehouseOptions = [];
            this.warehouseOptions = [];
          });
        return;
      }
      const userId = this.$store.state.user.userId;
      listWarehouseAll(userId).then(response => {
        const rows = Array.isArray(response) ? response : (response && response.data) || [];
        this.allWarehouseOptions = this.normalizeWarehouseOptions(rows);
        this.warehouseOptions = this.allWarehouseOptions;
      });
    },
    filterMethod(query) {
      if (!query) {
        this.warehouseOptions = this.allWarehouseOptions;
        return;
      }
      const q = query.trim().toUpperCase();
      this.warehouseOptions = (this.allWarehouseOptions || []).filter(item => {
        const code = String(item.code || item.warehouseCode || "").toUpperCase();
        const name = String(item.name || item.warehouseName || "").toUpperCase();
        const referred = String(item.referredName || "").toUpperCase();
        const py = this.getPinyinInitials(item.name || item.warehouseName || "");
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
}
</script>
