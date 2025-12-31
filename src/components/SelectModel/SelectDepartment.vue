<template>
  <el-select v-model="department" 
             filterable
             :filter-method="filterMethod"
             clearable
             placeholder="请输入科室名称或首字母搜索"
             :disabled="value2"
  >
    <el-option
      v-for="item in departmentOptions"
      :key="item.id"
      :label="item.name"
      :value="item.id"
    ></el-option>
  </el-select>
</template>

<script>
import { listdepartAll} from "@/api/foundation/depart";
import { pinyin } from 'pinyin-pro';

export default {
  // props: ['value','size'],
  props: ['value','value2'],
  data() {
    return {
      // 科室选项（当前显示的选项）
      departmentOptions: [],
      // 所有科室列表（用于过滤）
      allDepartments: [],
      // 表单参数
      form: {},
    }
  },
  computed: {
    department: {
      get() {
        // 确保返回的值类型与选项中的value类型一致（都是数字或都是字符串）
        if (this.value != null && this.allDepartments.length > 0) {
          // 如果value是字符串，转换为数字；如果是数字，保持原样
          const valueNum = typeof this.value === 'string' ? parseInt(this.value) : this.value;
          // 检查选项列表中是否存在该值
          const exists = this.allDepartments.some(item => item.id === valueNum || item.id === this.value);
          if (exists) {
            return valueNum;
          }
        }
        return this.value;
      },
      set(v) {
        this.$emit('input', v);
      }
    }
  },
  watch: {
    value(newVal) {
      // 当value变化时，确保能正确显示
      if (newVal != null && this.allDepartments.length > 0) {
        this.$nextTick(() => {
          // 强制更新组件
        });
      }
    }
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询科室列表 */
    getList() {
      let userId = this.$store.state.user.userId;
      listdepartAll(userId).then(response => {
        this.allDepartments = response || [];
        this.departmentOptions = this.allDepartments;
      });
    },
    /** 过滤方法（支持模糊搜索和首字母搜索） */
    filterMethod(query) {
      if (!query) {
        this.departmentOptions = this.allDepartments;
        return;
      }
      
      const queryUpper = query.toUpperCase();
      const queryLower = query.toLowerCase();
      
      this.departmentOptions = this.allDepartments.filter(item => {
        if (!item.name) return false;
        
        const name = item.name;
        const nameUpper = name.toUpperCase();
        
        // 1. 名称模糊匹配（不区分大小写）
        if (name.includes(query) || nameUpper.includes(queryUpper)) {
          return true;
        }
        
        // 2. 首字母匹配
        if (this.isPinyin(query)) {
          const pinyinInitials = this.getPinyinInitials(name);
          if (pinyinInitials.includes(queryUpper)) {
            return true;
          }
        }
        
        return false;
      });
    },
    /** 判断是否为拼音首字母 */
    isPinyin(str) {
      return /^[a-zA-Z]+$/.test(str);
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
    },
  }
}
</script>
