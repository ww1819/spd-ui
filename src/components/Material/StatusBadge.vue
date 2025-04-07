<template>
<el-tag
  :type="computedType"
  :class="computedClass"
  effect="dark"
  size="mini"
  v-if="showTooltip"
>
  <i :class="iconClass" class="status-icon"></i>
  {{ text }}

  <!-- 可选：添加悬浮提示 -->
  <el-tooltip
    v-if="tooltipText"
    placement="top"
    :content="tooltipText">
    <span class="status-tooltip-target"></span>
  </el-tooltip>
</el-tag>

<!-- 简化版（无悬浮提示） -->
<el-tag
  v-else
  :type="computedType"
  :class="computedClass"
  effect="dark"
  size="mini">
  <i :class="iconClass" class="status-icon"></i>
  {{ text }}
</el-tag>
</template>

<script>
import { computed } from 'vue';

export default {
  name: 'StatusBadge',
  props: {
    status: {
      type: String,
      required: true,
      validator: value => ['normal', 'used', 'expired', 'lowStock', 'locked'].includes(value)
    },
    tooltipText: {
      type: String,
      default: ''
    },
    showTooltip: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    // 状态配置映射表
    statusConfig() {
      return {
        normal: {
          type: 'success',
          text: '正常可用',
          icon: 'el-icon-circle-check',
          className: 'status-normal'
        },
        used: {
          type: 'info',
          text: '已计费',
          icon: 'el-icon-finished',
          className: 'status-used'
        },
        expired: {
          type: 'danger',
          text: '已过期',
          icon: 'el-icon-warning',
          className: 'status-expired'
        },
        lowStock: {
          type: 'warning',
          text: '库存预警',
          icon: 'el-icon-box',
          className: 'status-low-stock'
        },
        locked: {
          type: 'danger',
          text: '已锁定',
          icon: 'el-icon-lock',
          className: 'status-locked'
        }
      };
    },

    computedType() {
      return this.statusConfig[this.status].type;
    },

    computedClass() {
      return this.statusConfig[this.status].className;
    },

    iconClass() {
      return `status-icon ${this.statusConfig[this.status].icon}`;
    }
  }
};
</script>

<style lang="scss" scoped>
// StatusBadge 组件样式
.status-badge {
  .el-tag {
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 14px;

    &.status-normal {
      background-color: #f0fff3;
      color: #67c23a;
    }

    &.status-used {
      background-color: #fdf6ec;
      color: #909399;
    }

    &.status-expired {
      background-color: #ffe5ec;
      color: #f56c6c;
    }

    &.status-low-stock {
      background-color: #fffbea;
      color: #ffa9406;
    }

    &.status-locked {
      background-color: #f0f0f0;
      color: #ff0000;
    }
  }

  .status-icon {
    margin-right: 5px;
    font-size: 12px;
    vertical-align: middle;
  }

  .status-tooltip-target {
    display: inline-block;
    width: 0;
    height: 0;
    visibility: hidden;
  }
}

// 可选：悬浮动画效果
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.status-badge:hover .status-tooltip-target {
  visibility: visible;
  animation: fadeIn 0.3s;
}
</style>

<i18n>
{
  "en": {
    "normal": "Normal",
    "used": "Used",
    "expired": "Expired",
    "lowStock": "Low Stock",
    "locked": "Locked"
  },
  "zh-CN": {
    "normal": "正常可用",
    "used": "已计费",
    "expired": "已过期",
    "lowStock": "库存预警",
    "locked": "已锁定"
  }
}
</i18n>
