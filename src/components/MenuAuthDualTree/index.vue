<template>
  <div class="menu-auth-dual-tree">
    <div class="menu-auth-dual-tree-legend">
      <span class="legend-col legend-existing"><i class="el-icon-lock" /> 已有权限</span>
      <span class="legend-col legend-select">本次选择</span>
      <span class="legend-name">菜单名称</span>
    </div>
    <el-tree
      ref="tree"
      class="menu-auth-dual-tree-body"
      :data="data"
      :props="treeProps"
      :node-key="nodeKey"
      :default-expand-all="defaultExpandAll"
      :expand-on-click-node="false"
      :style="treeStyle"
      :empty-text="emptyText"
    >
      <span slot-scope="{ node, data: nodeData }" class="menu-auth-dual-node">
        <el-checkbox
          class="legend-col legend-existing"
          :value="isExisting(nodeData)"
          disabled
        />
        <el-checkbox
          class="legend-col legend-select"
          :value="isSelected(nodeData)"
          :disabled="!isNodeSelectable(nodeData)"
          @change="val => toggleSelect(nodeData, val)"
        />
        <span class="legend-name node-label" :class="{ 'node-disabled': !isNodeSelectable(nodeData) }">
          {{ node.label }}
        </span>
      </span>
    </el-tree>
  </div>
</template>

<script>
export default {
  name: 'MenuAuthDualTree',
  props: {
    data: { type: Array, default: () => [] },
    value: { type: Array, default: () => [] },
    /** 打开弹窗时已有的菜单 ID（锁定展示，不随本次勾选变化） */
    existingMenuIds: { type: Array, default: () => [] },
    nodeKey: { type: String, default: 'id' },
    treeProps: {
      type: Object,
      default: () => ({ label: 'label', children: 'children' })
    },
    defaultExpandAll: { type: Boolean, default: false },
    maxHeight: { type: String, default: '300px' },
    emptyText: { type: String, default: '加载中，请稍候' }
  },
  data() {
    return {
      selectedMap: {}
    };
  },
  computed: {
    treeStyle() {
      return { maxHeight: this.maxHeight, overflowY: 'auto' };
    },
    existingSet() {
      const s = new Set();
      (this.existingMenuIds || []).forEach(id => {
        if (id != null && id !== '') s.add(String(id));
      });
      return s;
    }
  },
  watch: {
    value: {
      immediate: true,
      handler(ids) {
        this.syncSelectedFromValue(ids);
      }
    }
  },
  methods: {
    resolveNodeId(nodeData) {
      if (!nodeData) return null;
      const k = this.nodeKey;
      const id = nodeData[k] != null ? nodeData[k] : (nodeData.menuId != null ? nodeData.menuId : nodeData.id);
      return id != null && id !== '' ? String(id) : null;
    },
    isNodeSelectable(nodeData) {
      return nodeData && nodeData.checkable !== false;
    },
    isExisting(nodeData) {
      const id = this.resolveNodeId(nodeData);
      return id != null && this.existingSet.has(id);
    },
    isSelected(nodeData) {
      const id = this.resolveNodeId(nodeData);
      return id != null && !!this.selectedMap[id];
    },
    syncSelectedFromValue(ids) {
      const map = {};
      (ids || []).forEach(id => {
        if (id != null && id !== '') map[String(id)] = true;
      });
      this.selectedMap = map;
    },
    emitValue() {
      const ids = Object.keys(this.selectedMap)
        .filter(k => this.selectedMap[k])
        .map(k => {
          const n = Number(k);
          return isNaN(n) ? k : n;
        });
      this.$emit('input', ids);
      this.$emit('change', ids);
    },
    toggleSelect(nodeData, checked) {
      if (!this.isNodeSelectable(nodeData)) return;
      const id = this.resolveNodeId(nodeData);
      if (!id) return;
      this.$set(this.selectedMap, id, !!checked);
      this.emitValue();
    },
    getSelectedIds() {
      return Object.keys(this.selectedMap)
        .filter(k => this.selectedMap[k])
        .map(k => {
          const n = Number(k);
          return isNaN(n) ? k : n;
        });
    },
    setSelectedIds(ids) {
      this.syncSelectedFromValue(ids);
      this.emitValue();
    },
    getCheckableIds(nodes, acc) {
      const list = acc || [];
      if (!nodes || !nodes.length) return list;
      nodes.forEach(n => {
        if (this.isNodeSelectable(n)) {
          const id = this.resolveNodeId(n);
          if (id != null) {
            const num = Number(id);
            list.push(isNaN(num) ? id : num);
          }
        }
        const chKey = (this.treeProps && this.treeProps.children) || 'children';
        if (n[chKey] && n[chKey].length) {
          this.getCheckableIds(n[chKey], list);
        }
      });
      return list;
    },
    selectAllCheckable() {
      const ids = this.getCheckableIds(this.data);
      this.setSelectedIds(ids);
    },
    clearSelection() {
      this.setSelectedIds([]);
    },
    setExpandAll(expanded) {
      const tree = this.$refs.tree;
      if (!tree || !tree.store || !tree.store.nodesMap) return;
      Object.values(tree.store.nodesMap).forEach(n => {
        n.expanded = !!expanded;
      });
    }
  }
};
</script>

<style scoped>
.menu-auth-dual-tree-legend,
.menu-auth-dual-node {
  display: flex;
  align-items: center;
  width: 100%;
  font-size: 13px;
}
.menu-auth-dual-tree-legend {
  padding: 6px 0 8px;
  color: #909399;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 4px;
}
.legend-col {
  flex: 0 0 72px;
  text-align: center;
}
.legend-existing {
  color: #909399;
}
.legend-select {
  color: #606266;
}
.legend-name {
  flex: 1;
  min-width: 0;
  padding-left: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.node-disabled {
  color: #c0c4cc;
}
.menu-auth-dual-tree-body >>> .el-tree-node__content {
  height: 32px;
}
</style>
